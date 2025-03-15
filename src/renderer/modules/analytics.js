/**
 * Analytics Module
 *
 * This module provides functionality for retrieving and displaying logs and analytics data.
 */

const { ipcRenderer } = require('electron');

/**
 * Get the most recent log entries
 * @param {Object} options - Options for log retrieval
 * @param {string} options.logType - Type of log to retrieve ('app', 'error', or 'renderer')
 * @param {number} options.limit - Maximum number of log entries to retrieve
 * @param {string} options.level - Filter by log level ('info', 'warn', 'error', or 'all')
 * @returns {Promise<Array>} - Array of log entries
 */
async function getLogs(options = {}) {
  const { logType = 'app', limit = 100, level = 'all' } = options;
  
  try {
    return await ipcRenderer.invoke('get-logs', { logType, limit, level });
  } catch (error) {
    console.error('Error retrieving logs:', error);
    return [];
  }
}

/**
 * Get analytics data about project actions
 * @returns {Promise<Object>} - Object containing analytics data
 */
async function getAnalyticsData() {
  try {
    return await ipcRenderer.invoke('get-analytics-data');
  } catch (error) {
    console.error('Error retrieving analytics data:', error);
    return {
      projectCounts: {
        active: 0,
        waiting: 0,
        someday: 0,
        archive: 0
      },
      statusChanges: [],
      actionsPerDay: []
    };
  }
}

/**
 * Format a log entry for display
 * @param {Object} entry - Log entry to format
 * @returns {string} - Formatted HTML for the log entry
 */
function formatLogEntry(entry) {
  const timestamp = new Date(entry.timestamp).toLocaleString();
  const levelClass = {
    'info': 'text-blue-600 dark:text-blue-400',
    'warn': 'text-yellow-600 dark:text-yellow-400',
    'error': 'text-red-600 dark:text-red-400'
  }[entry.level] || 'text-gray-600 dark:text-gray-400';
  
  let dataHtml = '';
  if (entry.data && Object.keys(entry.data).length > 0) {
    dataHtml = `<div class="mt-1 text-xs font-mono bg-gray-100 dark:bg-gray-800 p-2 rounded overflow-auto max-h-32">${JSON.stringify(entry.data, null, 2)}</div>`;
  }
  
  return `
    <div class="log-entry p-3 border-b border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
      <div class="flex justify-between items-start">
        <span class="${levelClass} font-medium">[${entry.level.toUpperCase()}]</span>
        <span class="text-xs text-gray-500 dark:text-gray-400">${timestamp}</span>
      </div>
      <div class="mt-1">${entry.message}</div>
      ${dataHtml}
    </div>
  `;
}

/**
 * Create a chart for displaying analytics data
 * @param {string} canvasId - ID of the canvas element to render the chart on
 * @param {Object} data - Data for the chart
 */
function createChart(canvasId, data) {
  const ctx = document.getElementById(canvasId).getContext('2d');
  
  // Check if Chart.js is available
  if (typeof Chart === 'undefined') {
    console.error('Chart.js is not available');
    return;
  }
  
  // Create a new chart
  new Chart(ctx, {
    type: 'bar',
    data: {
      labels: data.labels,
      datasets: [{
        label: data.label,
        data: data.values,
        backgroundColor: 'rgba(59, 130, 246, 0.5)',
        borderColor: 'rgb(59, 130, 246)',
        borderWidth: 1
      }]
    },
    options: {
      responsive: true,
      scales: {
        y: {
          beginAtZero: true,
          ticks: {
            precision: 0
          }
        }
      }
    }
  });
}

module.exports = {
  getLogs,
  getAnalyticsData,
  formatLogEntry,
  createChart
};
