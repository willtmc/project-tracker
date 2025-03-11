// Report management module
const projectData = require('./projectData');
const uiManager = require('./uiManager');

/**
 * Generate a report of project statistics
 */
function generateReport() {
  console.log('Generating report');
  
  // Get report container
  const reportContainer = document.getElementById('report-container');
  if (!reportContainer) {
    console.error('Report container not found');
    uiManager.showNotification('Error: Report container not found', 'error');
    return;
  }
  
  // Get projects data
  const projects = projectData.getProjectsData();
  if (!projects) {
    console.error('Projects data not available for report');
    uiManager.showNotification('Error: Projects data not available', 'error');
    return;
  }
  
  // Clear previous report
  reportContainer.innerHTML = '';
  
  // Create report header
  const reportHeader = document.createElement('h2');
  reportHeader.textContent = 'Project Statistics';
  reportContainer.appendChild(reportHeader);
  
  // Count projects by status
  const activeCount = projects.active ? projects.active.length : 0;
  const waitingCount = projects.waiting ? projects.waiting.length : 0;
  const somedayCount = projects.someday ? projects.someday.length : 0;
  const archiveCount = projects.archive ? projects.archive.length : 0;
  const totalCount = activeCount + waitingCount + somedayCount + archiveCount;
  
  // Create report summary
  const reportSummary = document.createElement('div');
  reportSummary.className = 'report-summary';
  reportSummary.innerHTML = `
    <div class="report-stat">
      <div class="stat-value">${activeCount}</div>
      <div class="stat-label">Active Projects</div>
    </div>
    <div class="report-stat">
      <div class="stat-value">${waitingCount}</div>
      <div class="stat-label">Waiting Projects</div>
    </div>
    <div class="report-stat">
      <div class="stat-value">${somedayCount}</div>
      <div class="stat-label">Someday Projects</div>
    </div>
    <div class="report-stat">
      <div class="stat-value">${archiveCount}</div>
      <div class="stat-label">Archived Projects</div>
    </div>
    <div class="report-stat total">
      <div class="stat-value">${totalCount}</div>
      <div class="stat-label">Total Projects</div>
    </div>
  `;
  reportContainer.appendChild(reportSummary);
  
  // Calculate well-formulated percentages
  let wellFormulatedActive = 0;
  let wellFormulatedWaiting = 0;
  let wellFormulatedSomeday = 0;
  
  if (projects.active) {
    wellFormulatedActive = projects.active.filter(p => p.isWellFormulated).length;
  }
  
  if (projects.waiting) {
    wellFormulatedWaiting = projects.waiting.filter(p => p.isWellFormulated).length;
  }
  
  if (projects.someday) {
    wellFormulatedSomeday = projects.someday.filter(p => p.isWellFormulated).length;
  }
  
  const activePercentage = activeCount > 0 ? Math.round((wellFormulatedActive / activeCount) * 100) : 0;
  const waitingPercentage = waitingCount > 0 ? Math.round((wellFormulatedWaiting / waitingCount) * 100) : 0;
  const somedayPercentage = somedayCount > 0 ? Math.round((wellFormulatedSomeday / somedayCount) * 100) : 0;
  
  // Create well-formulated section
  const wellFormulatedSection = document.createElement('div');
  wellFormulatedSection.className = 'well-formulated-section';
  wellFormulatedSection.innerHTML = `
    <h3>Well-Formulated Projects</h3>
    <div class="progress-container">
      <div class="progress-label">Active</div>
      <div class="progress-bar">
        <div class="progress" style="width: ${activePercentage}%;"></div>
      </div>
      <div class="progress-value">${activePercentage}%</div>
    </div>
    <div class="progress-container">
      <div class="progress-label">Waiting</div>
      <div class="progress-bar">
        <div class="progress" style="width: ${waitingPercentage}%;"></div>
      </div>
      <div class="progress-value">${waitingPercentage}%</div>
    </div>
    <div class="progress-container">
      <div class="progress-label">Someday</div>
      <div class="progress-bar">
        <div class="progress" style="width: ${somedayPercentage}%;"></div>
      </div>
      <div class="progress-value">${somedayPercentage}%</div>
    </div>
  `;
  reportContainer.appendChild(wellFormulatedSection);
  
  // Create recently completed section
  const recentlyCompleted = document.createElement('div');
  recentlyCompleted.className = 'recently-completed';
  recentlyCompleted.innerHTML = '<h3>Recently Completed Projects</h3>';
  
  // Get recently archived projects (last 30 days)
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
  
  let recentlyArchivedProjects = [];
  if (projects.archive) {
    recentlyArchivedProjects = projects.archive
      .filter(p => new Date(p.lastModified) > thirtyDaysAgo)
      .sort((a, b) => new Date(b.lastModified) - new Date(a.lastModified))
      .slice(0, 10); // Top 10 most recently archived
  }
  
  if (recentlyArchivedProjects.length > 0) {
    const recentList = document.createElement('ul');
    recentList.className = 'recent-list';
    
    recentlyArchivedProjects.forEach(project => {
      const listItem = document.createElement('li');
      listItem.innerHTML = `
        <div class="recent-project-title">${project.title}</div>
        <div class="recent-project-date">${new Date(project.lastModified).toLocaleDateString()}</div>
      `;
      recentList.appendChild(listItem);
    });
    
    recentlyCompleted.appendChild(recentList);
  } else {
    recentlyCompleted.innerHTML += '<p>No projects completed in the last 30 days</p>';
  }
  
  reportContainer.appendChild(recentlyCompleted);
  
  console.log('Report generated successfully');
}

module.exports = {
  generateReport
};
