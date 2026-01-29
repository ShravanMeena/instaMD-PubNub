/**
 * Production-safe logger utility.
 * Logs are only output when in development mode.
 */
const isDev = import.meta.env.DEV;

const logger = {
  log: (...args) => {
    if (isDev) {
      console.log(...args);
    }
  },
  warn: (...args) => {
    if (isDev) {
      console.warn(...args);
    }
  },
  error: (...args) => {
    // Errors might be useful in production for monitoring services (like Sentry),
    // but for now, we'll keep them dev-only or rigorous based on user request "only logs use on local".
    // However, usually errors should be visible or sent to a service. 
    // Given the request "only logs use on local", I'll restrict them too, 
    // BUT typically critical errors should be seen. I will allow errors if they are critical, 
    // but the user said "remove console from all code".
    // I'll stick to the strict interpretation: dev only.
    if (isDev) {
      console.error(...args);
    }
  },
  info: (...args) => {
    if (isDev) {
      console.info(...args);
    }
  },
  debug: (...args) => {
    if (isDev) {
      console.debug(...args);
    }
  }
};

export default logger;
