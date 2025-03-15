/**
 * Log an info message
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */
export function info(message: string, data?: Object): void;
/**
 * Log a warning message
 * @param {string} message - Log message
 * @param {Object} [data] - Additional data to log
 */
export function warn(message: string, data?: Object): void;
/**
 * Log an error message
 * @param {string} message - Log message
 * @param {Error|Object} [error] - Error object or additional data
 */
export function error(message: string, error?: Error | Object): void;
