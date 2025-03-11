const fs = require('fs').promises;
const path = require('path');
const { Project, ProjectHistory } = require('../models/database');
const { OpenAI } = require('openai');
const { DuplicateDetector } = require('./duplicateDetector');

// Configure OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// Project directories from the original Python script
const BASE_DIR = "/Users/willmclemore/Library/Mobile Documents/27N4MQEA55~pro~writer/Documents";
const PROJECTS_DIR = path.join(BASE_DIR, "WTM Projects");
const WAITING_DIR = path.join(BASE_DIR, "WTM Projects Waiting");
const ARCHIVE_DIR = path.join(BASE_DIR, "WTM Projects Archive");
const SOMEDAY_DIR = path.join(BASE_DIR, "WTM Projects Someday");

class ProjectManager {
  constructor() {
    this.projectDirs = {
      active: PROJECTS_DIR,
      waiting: WAITING_DIR,
      archive: ARCHIVE_DIR,
      someday: SOMEDAY_DIR
    };
    this.duplicateDetector = new DuplicateDetector();
  }

  /**
   * Ensure all project directories exist
   */
  async ensureDirectoriesExist() {
    console.log('Ensuring project directories exist...');
    for (const [status, dir] of Object.entries(this.projectDirs)) {
      try {
        await fs.access(dir);
        console.log(`Directory exists: ${dir}`);
      } catch (error) {
        console.log(`Directory does not exist: ${dir}. Error: ${error.message}`);
        // Don't create directories, just log the error
      }
    }
    console.log('All directories checked');
  }

  /**
   * Get all projects from all directories
   */
  async getAllProjects() {
    console.log('Getting all projects...');
    // Ensure directories exist
    await this.ensureDirectoriesExist();
    
    const projects = {
      active: [],
      waiting: [],
      someday: [],
      archive: []
    };
    
    for (const [status, dir] of Object.entries(this.projectDirs)) {
      console.log(`Loading projects from ${status} directory: ${dir}`);
      try {
        // Check if directory exists before trying to read it
        await fs.access(dir);
        projects[status] = await this.getProjectsFromDirectory(dir, status);
        console.log(`Loaded ${projects[status].length} ${status} projects`);
      } catch (error) {
        console.error(`Error accessing directory ${dir}:`, error.message);
        // Keep the empty array for this status
      }
    }
    
    return projects;
  }

  /**
   * Get projects from a specific directory
   */
  async getProjectsFromDirectory(directory, status) {
    try {
      const files = await fs.readdir(directory);
      const projectFiles = files.filter(file => file.endsWith('.txt') && !file.startsWith('.'));
      
      const projects = [];
      
      for (const file of projectFiles) {
        const filePath = path.join(directory, file);
        const stats = await fs.stat(filePath);
        const content = await fs.readFile(filePath, 'utf8');
        
        // Parse project content
        const projectData = this.parseProjectContent(content);
        const completedTasks = this.extractCompletedTasks(content);
        const totalTasks = this.countTotalTasks(content);
        const { isWellFormulated, needsImprovement, issues } = this.validateProjectStructure(content, file);
        
        // Update or create project in database
        await Project.upsert({
          filename: file,
          path: filePath,
          title: projectData.title || this.extractProjectName(file),
          status,
          lastModified: stats.mtime,
          totalTasks,
          completedTasks: completedTasks.length,
          isWellFormulated,
          needsImprovement,
          issues: JSON.stringify(issues)
        });
        
        // Add to results
        projects.push({
          filename: file,
          path: filePath,
          title: projectData.title || this.extractProjectName(file),
          status,
          lastModified: stats.mtime,
          content,
          totalTasks,
          completedTasks: completedTasks.length,
          completionPercentage: totalTasks > 0 ? (completedTasks.length / totalTasks) * 100 : 0,
          isWellFormulated,
          needsImprovement,
          issues,
          ...projectData
        });
      }
      
      return projects;
    } catch (error) {
      console.error(`Error reading directory ${directory}:`, error);
      return [];
    }
  }

  /**
   * Parse project content to extract structured data
   */
  parseProjectContent(content) {
    const projectData = {
      title: null,
      endState: null,
      tasks: [],
      additionalInfo: null,
      waitingInput: null
    };
    
    // Extract title (first heading)
    const titleMatch = content.match(/^\s*#\s+(.+)$/m);
    if (titleMatch) {
      projectData.title = titleMatch[1].trim();
    }
    
    // Extract end state
    const endStateMatch = content.match(/##\s+End\s+State\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (endStateMatch) {
      projectData.endState = endStateMatch[1].trim();
    }
    
    // Extract tasks
    const tasksMatch = content.match(/##\s+Tasks\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (tasksMatch) {
      const tasksList = tasksMatch[1].trim();
      const taskRegex = /- \[([ xX])\]\s*(.+)$/gm;
      let match;
      
      while ((match = taskRegex.exec(tasksList)) !== null) {
        projectData.tasks.push({
          completed: match[1].toLowerCase() === 'x',
          description: match[2].trim()
        });
      }
    }
    
    // Extract additional information
    const additionalInfoMatch = content.match(/##\s+Additional\s+Information\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (additionalInfoMatch) {
      projectData.additionalInfo = additionalInfoMatch[1].trim();
    }
    
    // Extract waiting input information
    const waitingInputMatch = content.match(/##\s+Waiting\s+on\s+Inputs\s*\n([\s\S]*?)(?=\n##|$)/i);
    if (waitingInputMatch) {
      projectData.waitingInput = waitingInputMatch[1].trim();
    }
    
    return projectData;
  }

  /**
   * Extract completed tasks from content
   */
  extractCompletedTasks(content) {
    const completedTasks = [];
    
    // Look for markdown-style checked checkboxes
    const checkboxPatterns = [
      /- \[x\] (.*?)(?:\n|$)/gi,  // - [x] Task
      /- \[X\] (.*?)(?:\n|$)/g,  // - [X] Task
      /✓ (.*?)(?:\n|$)/g,        // ✓ Task
      /✅ (.*?)(?:\n|$)/g,        // ✅ Task
      /\[DONE\] (.*?)(?:\n|$)/g, // [DONE] Task
      /- \[DONE\] (.*?)(?:\n|$)/g // - [DONE] Task
    ];
    
    for (const pattern of checkboxPatterns) {
      let match;
      while ((match = pattern.exec(content)) !== null) {
        completedTasks.push(match[1].trim());
      }
    }
    
    return completedTasks;
  }

  /**
   * Count total tasks in content
   */
  countTotalTasks(content) {
    // Match both checked and unchecked checkboxes
    const checkboxPatterns = [
      /- \[[ xX]\] /g,  // - [ ] or - [x] or - [X]
      /✓ /g,            // ✓
      /✅ /g,            // ✅
      /\[DONE\] /g,     // [DONE]
      /\[TODO\] /g,     // [TODO]
      /- \[DONE\] /g,   // - [DONE]
      /- \[TODO\] /g    // - [TODO]
    ];
    
    let total = 0;
    for (const pattern of checkboxPatterns) {
      const matches = content.match(pattern) || [];
      total += matches.length;
    }
    
    return total;
  }

  /**
   * Extract project name from filename
   */
  extractProjectName(filename) {
    // Remove common prefixes like # or numbers
    let cleanName = filename.replace(/^[#\s0-9]+/, '');
    // Remove file extension
    cleanName = path.basename(cleanName, path.extname(cleanName));
    return cleanName.trim();
  }

  /**
   * Validate if project has well-formulated structure
   * Returns an object with isWellFormulated and needsImprovement flags
   */
  validateProjectStructure(content, filename = '') {
    // Check for required sections
    const hasTitle = /^\s*#\s+.+$/m.test(content);
    const hasEndState = /##\s+End\s+State/i.test(content);
    const hasTasks = /##\s+Tasks/i.test(content);
    const hasAdditionalInfo = /##\s+Additional\s+Information/i.test(content);
    
    // Extract end state content
    const endStateMatch = content.match(/##\s+End\s+State\s*\n([\s\S]*?)(?=\n##|$)/i);
    const endStateContent = endStateMatch ? endStateMatch[1].trim() : '';
    
    // Extract title
    const titleMatch = content.match(/^\s*#\s+(.+)$/m);
    const title = titleMatch ? titleMatch[1].trim() : '';
    
    // Check if filename reflects the end state
    const filenameReflectsEndState = filename && endStateContent && 
      (filename.toLowerCase().includes(endStateContent.toLowerCase().substring(0, 10)) || 
       endStateContent.toLowerCase().includes(filename.replace(/\.txt$/, '').toLowerCase().substring(0, 10)));
    
    // Basic validation - must have all required sections
    const isWellFormulated = hasTitle && hasEndState && hasTasks && hasAdditionalInfo && filenameReflectsEndState;
    
    // Check if tasks section has at least 3 tasks
    const tasksMatch = content.match(/##\s+Tasks\s*\n([\s\S]*?)(?=\n##|$)/i);
    const tasksContent = tasksMatch ? tasksMatch[1].trim() : '';
    const taskCount = (tasksContent.match(/- \[[ xX]\]/g) || []).length;
    const hasEnoughTasks = taskCount >= 3;
    
    // Project needs improvement if it's technically well-formulated but lacks quality
    const needsImprovement = 
      (hasTitle && hasEndState && hasTasks) && // Basic structure is there
      (!hasAdditionalInfo || !filenameReflectsEndState || !hasEnoughTasks || endStateContent.length < 30);
    
    return {
      isWellFormulated,
      needsImprovement,
      issues: {
        missingTitle: !hasTitle,
        missingEndState: !hasEndState,
        missingTasks: !hasTasks,
        missingAdditionalInfo: !hasAdditionalInfo,
        filenameDoesNotReflectEndState: !filenameReflectsEndState,
        insufficientTasks: !hasEnoughTasks,
        briefEndState: endStateContent.length < 30
      }
    };
  }

  /**
   * Update project status (active, waiting, someday, archive)
   */
  async updateProjectStatus(projectPath, isActive, isWaiting, waitingInput, targetStatus) {
    try {
      // Get current project info
      const filename = path.basename(projectPath);
      const project = await Project.findByPk(filename);
      
      if (!project) {
        throw new Error(`Project ${filename} not found in database`);
      }
      
      const previousStatus = project.status;
      let newStatus = previousStatus;
      
      // Determine new status based on inputs
      if (targetStatus && ['active', 'waiting', 'someday', 'archive'].includes(targetStatus)) {
        // If a specific target status is provided, use it
        newStatus = targetStatus;
      } else if (!isActive) {
        newStatus = 'someday';
      } else if (isWaiting) {
        newStatus = 'waiting';
      } else {
        newStatus = 'active';
      }
      
      // If status changed, move the file
      if (newStatus !== previousStatus) {
        const sourceDir = this.projectDirs[previousStatus];
        const targetDir = this.projectDirs[newStatus];
        
        const sourceFilePath = path.join(sourceDir, filename);
        const targetFilePath = path.join(targetDir, filename);
        
        // Read content
        const content = await fs.readFile(sourceFilePath, 'utf8');
        
        // Update waiting input information if provided
        let updatedContent = content;
        if (newStatus === 'waiting' && waitingInput) {
          // Check if Waiting on Inputs section exists
          if (/##\s+Waiting\s+on\s+Inputs/i.test(content)) {
            // Update existing section
            updatedContent = content.replace(
              /(##\s+Waiting\s+on\s+Inputs\s*\n)[\s\S]*?(?=\n##|$)/i,
              `$1- This project is waiting on: ${waitingInput}\n`
            );
          } else {
            // Add new section at the end
            updatedContent = `${content.trim()}\n\n## Waiting on Inputs\n- This project is waiting on: ${waitingInput}\n`;
          }
        }
        
        // Write to new location
        await fs.writeFile(targetFilePath, updatedContent, 'utf8');
        
        // Delete from old location
        await fs.unlink(sourceFilePath);
        
        // Update database
        project.status = newStatus;
        project.path = targetFilePath;
        project.isWaiting = newStatus === 'waiting';
        project.waitingInput = waitingInput || null;
        await project.save();
        
        // Record history
        await ProjectHistory.create({
          filename,
          previousStatus,
          newStatus,
          timestamp: new Date()
        });
        
        return { success: true, message: `Project moved to ${newStatus}` };
      } else if (isWaiting && waitingInput && waitingInput !== project.waitingInput) {
        // Just update waiting input without moving file
        const filePath = project.path;
        const content = await fs.readFile(filePath, 'utf8');
        
        let updatedContent = content;
        if (/##\s+Waiting\s+on\s+Inputs/i.test(content)) {
          // Update existing section
          updatedContent = content.replace(
            /(##\s+Waiting\s+on\s+Inputs\s*\n)[\s\S]*?(?=\n##|$)/i,
            `$1- This project is waiting on: ${waitingInput}\n`
          );
        } else {
          // Add new section at the end
          updatedContent = `${content.trim()}\n\n## Waiting on Inputs\n- This project is waiting on: ${waitingInput}\n`;
        }
        
        await fs.writeFile(filePath, updatedContent, 'utf8');
        
        // Update database
        project.isWaiting = true;
        project.waitingInput = waitingInput;
        await project.save();
        
        return { success: true, message: 'Waiting input updated' };
      }
      
      return { success: true, message: 'No changes needed' };
    } catch (error) {
      console.error('Error updating project status:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Validate if a project is well-formulated
   */
  async validateProject(projectPath) {
    try {
      const content = await fs.readFile(projectPath, 'utf8');
      const { isWellFormulated, needsImprovement, issues } = this.validateProjectStructure(content, path.basename(projectPath));
      const projectData = this.parseProjectContent(content);
      
      return {
        success: true,
        isWellFormulated,
        needsImprovement,
        issues,
        projectData
      };
    } catch (error) {
      console.error('Error validating project:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Reformulate a project using OpenAI
   */
  async reformulateProject(projectPath, endState) {
    try {
      const content = await fs.readFile(projectPath, 'utf8');
      const filename = path.basename(projectPath);
      const directory = path.dirname(projectPath);
      
      // Extract existing project data to preserve
      const projectData = this.parseProjectContent(content);
      const completedTasks = this.extractCompletedTasks(content);
      const waitingInput = projectData.waitingInput;
      
      // Prepare prompt for OpenAI
      const prompt = `Please reformulate the following project to ensure it has a clear title, end state, tasks, and additional information. The project filename is "${filename}" and the user has provided this updated end state: "${endState}".

Current project content:
${content}

Please provide a well-structured project with the following sections:
1. A clear title (as a level 1 heading)
2. End State (as a level 2 heading) - Use the end state provided by the user: "${endState}"
3. Tasks (as a level 2 heading with at least 3 checkboxes using "- [ ]" format)
4. Additional Information (as a level 2 heading)

If the project is waiting for input, include a section:
5. Waiting on Inputs (as a level 2 heading)

Make sure to:
- Preserve all unique information from the original project
- Keep the completion status of existing tasks (use "- [x]" for completed tasks)
- Make the end state detailed (at least 30 characters)
- Suggest a new filename that reflects the end state (without spaces, using hyphens instead)

Provide your response in this format:

FILENAME: suggested-filename.txt

CONTENT:
# Project Title

## End State
...

## Tasks
...

## Additional Information
...

## Waiting on Inputs (if applicable)
...`;
      
      // Call OpenAI API
      const completion = await openai.chat.completions.create({
        model: "gpt-4o", // Using GPT-4o for improved project reformulation
        messages: [
          { role: "system", content: "You are a helpful assistant that reformulates project descriptions to ensure they are well-structured and complete." },
          { role: "user", content: prompt }
        ],
        temperature: 0.7,
        max_tokens: 2000
      });
      
      // Get reformulated content
      const reformulatedText = completion.choices[0].message.content;
      
      // Extract filename and content from the response
      const filenameMatch = reformulatedText.match(/FILENAME:\s*([\w-]+\.txt)/i);
      const contentMatch = reformulatedText.match(/CONTENT:\s*([\s\S]+)/i);
      
      let newFilename = filename; // Default to keeping the same filename
      let reformulatedContent = contentMatch ? contentMatch[1].trim() : reformulatedText;
      
      // If a new filename was suggested, use it
      if (filenameMatch && filenameMatch[1]) {
        newFilename = filenameMatch[1].trim();
      }
      
      // Write back to file with potentially new filename
      const newPath = path.join(directory, newFilename);
      await fs.writeFile(newPath, reformulatedContent, 'utf8');
      
      // If the filename changed, delete the old file
      if (newPath !== projectPath) {
        await fs.unlink(projectPath);
      }
      
      // Validate the reformulated project
      const { isWellFormulated, needsImprovement } = this.validateProjectStructure(reformulatedContent, newFilename);
      
      // Update database
      await Project.upsert({
        filename: newFilename,
        path: newPath,
        status: projectData.status || 'active',
        content: reformulatedContent,
        waitingInput: waitingInput,
        totalTasks: this.countTotalTasks(reformulatedContent),
        completedTasks: completedTasks.length,
        isWellFormulated,
        needsImprovement
      });
      
      // If the old entry had a different filename, remove it
      if (newFilename !== filename) {
        const oldProject = await Project.findByPk(filename);
        if (oldProject) {
          await oldProject.destroy();
        }
      }
      
      return {
        success: true,
        message: 'Project reformulated successfully',
        reformulatedContent,
        newFilename,
        isWellFormulated,
        needsImprovement
      };
    } catch (error) {
      console.error('Error reformulating project:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Generate a report of project status and changes
   */
  async generateReport() {
    try {
      // Get all projects
      const projects = await this.getAllProjects();
      
      // Get recent history
      const recentHistory = await ProjectHistory.findAll({
        order: [['timestamp', 'DESC']],
        limit: 50
      });
      
      // Calculate statistics
      const stats = {
        active: projects.active.length,
        waiting: projects.waiting.length,
        someday: projects.someday.length,
        archive: projects.archive.length,
        total: 0,
        completedTasks: 0,
        totalTasks: 0,
        completionRate: 0
      };
      
      stats.total = stats.active + stats.waiting + stats.someday + stats.archive;
      
      // Calculate task completion stats
      for (const status of Object.keys(projects)) {
        for (const project of projects[status]) {
          stats.completedTasks += project.completedTasks;
          stats.totalTasks += project.totalTasks;
        }
      }
      
      stats.completionRate = stats.totalTasks > 0 ? (stats.completedTasks / stats.totalTasks) * 100 : 0;
      
      return {
        success: true,
        timestamp: new Date().toISOString(),
        stats,
        projects,
        recentHistory
      };
    } catch (error) {
      console.error('Error generating report:', error);
      return { success: false, message: error.message };
    }
  }

  /**
   * Find potential duplicate projects within active projects
   * @returns {Promise<Array>} Array of duplicate groups
   */
  async findPotentialDuplicates() {
    console.log('Finding potential duplicate projects...');
    
    try {
      // Get active projects
      const projects = await this.getAllProjects();
      const activeProjects = projects.active || [];
      
      if (activeProjects.length < 2) {
        console.log('Not enough active projects to find duplicates');
        return [];
      }
      
      // Use the duplicate detector to find potential duplicates
      const duplicateGroups = await this.duplicateDetector.findPotentialDuplicates(activeProjects);
      
      // Update database to mark projects as potential duplicates
      for (const group of duplicateGroups) {
        for (const project of group) {
          await Project.update(
            { hasPotentialDuplicates: true },
            { where: { filename: project.filename } }
          );
        }
      }
      
      return duplicateGroups;
    } catch (error) {
      console.error('Error finding potential duplicates:', error);
      return [];
    }
  }

  /**
   * Merge duplicate projects
   * @param {Array} projectPaths Array of project file paths to merge
   * @returns {Promise<Object>} Result of the merge operation
   */
  async mergeDuplicateProjects(projectPaths) {
    console.log(`Merging duplicate projects: ${projectPaths.join(', ')}`);
    
    try {
      if (!projectPaths || projectPaths.length < 2) {
        throw new Error('At least two projects are required for merging');
      }
      
      // Verify which files actually exist
      const existingPaths = [];
      for (const projectPath of projectPaths) {
        try {
          await fs.access(projectPath, fs.constants.F_OK);
          existingPaths.push(projectPath);
        } catch (err) {
          console.log(`File does not exist, skipping: ${projectPath}`);
        }
      }
      
      // Check if we still have enough files to merge
      if (existingPaths.length < 2) {
        throw new Error(`Not enough existing files to merge. Only found ${existingPaths.length} files.`);
      }
      
      console.log(`Merging ${existingPaths.length} projects...`);
      
      // Get project objects from paths
      const projects = [];
      for (const projectPath of existingPaths) {
        const filename = path.basename(projectPath);
        const content = await fs.readFile(projectPath, 'utf8');
        const stats = await fs.stat(projectPath);
        
        // Parse project content
        const projectData = this.parseProjectContent(content);
        
        projects.push({
          filename,
          path: projectPath,
          title: projectData.title || this.extractProjectName(filename),
          content,
          lastModified: stats.mtime,
          ...projectData
        });
      }
      
      // Merge projects using the duplicate detector
      const mergedProject = await this.duplicateDetector.mergeProjects(projects);
      
      // Keep the first project's path as the target path
      const targetPath = existingPaths[0];
      
      // Write the merged content to the target path
      await fs.writeFile(targetPath, mergedProject.content, 'utf8');
      
      // Delete the other project files
      for (let i = 1; i < existingPaths.length; i++) {
        await fs.unlink(existingPaths[i]);
        
        // Update database to remove the deleted project
        const filename = path.basename(existingPaths[i]);
        await Project.destroy({ where: { filename } });
      }
      
      // Update the database entry for the merged project
      const mergedFilename = path.basename(targetPath);
      const projectData = this.parseProjectContent(mergedProject.content);
      const { isWellFormulated, needsImprovement } = this.validateProjectStructure(mergedProject.content, mergedFilename);
      
      await Project.upsert({
        filename: mergedFilename,
        path: targetPath,
        status: 'active',
        content: mergedProject.content,
        totalTasks: this.countTotalTasks(mergedProject.content),
        completedTasks: this.extractCompletedTasks(mergedProject.content).length,
        isWellFormulated,
        needsImprovement,
        hasPotentialDuplicates: false,
        lastModified: new Date()
      });
      
      console.log('Projects merged successfully');
      return { success: true, message: 'Projects merged successfully' };
    } catch (error) {
      console.error('Error merging duplicate projects:', error);
      return { success: false, message: `Error merging projects: ${error.message}` };
    }
  }

  /**
   * Get all projects with potential duplicates
   * @returns {Promise<Array>} Array of projects with potential duplicates
   */
  async getProjectsWithPotentialDuplicates() {
    console.log('Getting projects with potential duplicates...');
    
    try {
      // Find all duplicate groups
      const duplicateGroups = await this.findPotentialDuplicates();
      
      // Flatten the groups into a single array of projects
      const projectsWithDuplicates = duplicateGroups.flat();
      
      return projectsWithDuplicates;
    } catch (error) {
      console.error('Error getting projects with potential duplicates:', error);
      return [];
    }
  }
}

module.exports = { ProjectManager };
