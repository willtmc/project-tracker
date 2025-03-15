declare function safeGetElement(id: any): HTMLElement | null;
declare function initializeUIElements(): void;
declare function init(): void;
declare function setupEventListeners(): void;
declare function initViewToggle(): void;
declare function setView(view: any, savePreference?: boolean): void;
declare function initThemeToggle(): void;
declare function toggleTheme(): void;
declare function initTabs(): void;
declare function switchTab(tabId: any): void;
declare function getCurrentTab(): any;
declare function loadProjects(): void;
declare function getMockProjects(): {
    active: {
        id: string;
        filename: string;
        title: string;
        content: string;
        status: string;
        lastModified: string;
        endState: string;
        totalTasks: number;
        completedTasks: number;
        completionPercentage: number;
        tasks: {
            id: string;
            title: string;
            completed: boolean;
        }[];
    }[];
    waiting: {
        id: string;
        filename: string;
        title: string;
        content: string;
        status: string;
        waitingInput: string;
        lastModified: string;
        totalTasks: number;
        completedTasks: number;
        completionPercentage: number;
        tasks: {
            id: string;
            title: string;
            completed: boolean;
        }[];
    }[];
    someday: {
        id: string;
        filename: string;
        title: string;
        content: string;
        status: string;
        lastModified: string;
        totalTasks: number;
        completedTasks: number;
        completionPercentage: number;
        tasks: {
            id: string;
            title: string;
            completed: boolean;
        }[];
    }[];
    archive: {
        id: string;
        filename: string;
        title: string;
        content: string;
        status: string;
        lastModified: string;
        endState: string;
        totalTasks: number;
        completedTasks: number;
        completionPercentage: number;
        tasks: {
            id: string;
            title: string;
            completed: boolean;
        }[];
    }[];
};
declare function renderProjects(): void;
declare function filterAndSortProjectsForStatus(statusProjects: any): any[];
declare function filterAndSortProjects(): any[];
declare function getProjectProgress(project: any): number;
declare function filterProjects(): void;
declare function updateCounters(): void;
declare function openProjectModal(project: any): void;
declare function closeProjectModal(): void;
declare function saveProjectChanges(): void;
declare function archiveProject(projectId: any): void;
declare function restoreProject(projectId: any): void;
declare function moveToWaiting(projectId: any): void;
declare function removeDuplicates(): void;
declare function sortProjects(): void;
declare function formulateProjects(): void;
declare function viewReport(): void;
declare function showNotification(message: any, type?: string): void;
declare function checkDatabaseConnection(): Promise<any>;
declare function retryDatabaseConnection(): void;
/**
 * Start the duplicate detection process
 */
declare function startDuplicateDetection(): Promise<void>;
/**
 * Display a duplicate group for review
 * @param {number} groupIndex - Index of the duplicate group to display
 */
declare function displayDuplicateGroup(groupIndex: number): void;
/**
 * Skip the current duplicate group
 */
declare function skipDuplicate(): void;
/**
 * Merge selected duplicate projects
 */
declare function mergeDuplicates(): Promise<void>;
/**
 * End the duplicate review process
 */
declare function endDuplicateReview(): void;
/**
 * Show loading state on a button
 * @param {HTMLElement} button - Button element to show loading state on
 */
declare function showLoading(button: HTMLElement): void;
/**
 * Hide loading state on a button
 * @param {HTMLElement} button - Button element to hide loading state on
 */
declare function hideLoading(button: HTMLElement): void;
/**
 * Start the project review process
 */
declare function startProjectReview(): Promise<void>;
/**
 * Show a project for review
 * @param {number} index - Index of the project to show
 */
declare function showProjectForReview(index: number): void;
/**
 * Show the next project for review
 */
declare function showNextProject(): void;
/**
 * Handle keyboard shortcuts for project review
 * @param {KeyboardEvent} event - Keyboard event
 */
declare function handleReviewKeypress(event: KeyboardEvent): void;
/**
 * Archive a project from the review
 * @param {Object} project - Project to archive
 */
declare function archiveProjectFromReview(project: Object): Promise<void>;
/**
 * Move a project to the Someday folder
 * @param {Object} project - Project to move
 */
declare function moveProjectToSomeday(project: Object): Promise<void>;
/**
 * Prompt for waiting input and move project to Waiting
 * @param {Object} project - Project to move
 */
declare function promptForWaitingInput(project: Object): void;
/**
 * End the project review process
 */
declare function endProjectReview(): void;
declare namespace projectGrids {
    let active: HTMLElement | null;
    let waiting: HTMLElement | null;
    let someday: HTMLElement | null;
    let archive: HTMLElement | null;
}
declare const tabButtons: NodeListOf<Element>;
declare const tabPanes: NodeListOf<Element>;
declare const gridViewBtn: HTMLElement | null;
declare const listViewBtn: HTMLElement | null;
declare const themeToggle: HTMLElement | null;
declare const projectSearch: HTMLElement | null;
declare const searchBtn: HTMLElement | null;
declare const filterStatus: HTMLElement | null;
declare const filterSort: HTMLElement | null;
declare const refreshBtn: HTMLElement | null;
declare const removeDuplicatesBtn: HTMLElement | null;
declare const sortProjectsBtn: HTMLElement | null;
declare const formulateProjectsBtn: HTMLElement | null;
declare const viewReportBtn: HTMLElement | null;
declare const notificationContainer: HTMLElement | null;
declare const projectModal: HTMLElement | null;
declare const modalTitle: HTMLElement | null;
declare const projectDetails: HTMLElement | null;
declare const projectActive: HTMLElement | null;
declare const projectWaiting: HTMLElement | null;
declare const waitingInput: HTMLElement | null;
declare const waitingInputGroup: HTMLElement | null;
declare const saveProjectBtn: HTMLElement | null;
declare const cancelBtn: HTMLElement | null;
declare const closeModalBtn: Element | null;
declare const activeCount: HTMLElement | null;
declare const waitingCount: HTMLElement | null;
declare const somedayCount: HTMLElement | null;
declare const archiveCount: HTMLElement | null;
declare const completionRate: HTMLElement | null;
declare let projects: any[];
declare let currentProject: null;
declare namespace currentFilter {
    let search: string;
    let status: string;
    let sort: string;
}
declare let startDuplicateDetectionBtn: any;
declare let duplicateReviewContainer: any;
declare let duplicateList: any;
declare let mergeDuplicatesBtn: any;
declare let skipDuplicateBtn: any;
declare let endDuplicateReviewBtn: any;
declare let startReviewBtn: any;
declare let nextReviewBtn: any;
declare let reviewProjectTitle: any;
declare let reviewProjectContent: any;
declare let reviewCount: any;
declare let reviewTotal: any;
declare let duplicatesCount: any;
declare let duplicateGroups: any[];
declare let currentDuplicateGroupIndex: number;
declare let activeProjectsForReview: any[];
declare let currentReviewIndex: number;
declare let reviewInProgress: boolean;
