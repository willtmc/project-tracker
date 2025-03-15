declare var console: Console;
import log = console.log;
import error = console.error;
import warn = console.warn;
export declare function debug(component: any, ...args: any[]): void;
export declare function logWithLevel(level: any, ...args: any[]): void;
export declare function close(): void;
export { log, error, warn };
