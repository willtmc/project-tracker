/**
 * Setup tabs functionality
 */
export function setupTabs(): void;
/**
 * Switch between tabs
 * @param {string} tabName The tab to switch to
 */
export function switchTab(tabName: string): Promise<void>;
/**
 * Get the current active tab
 * @returns {string} The current tab name
 */
export function getCurrentTab(): string;
/**
 * Setup event listeners for tabs
 */
export function setupTabEventListeners(): void;
