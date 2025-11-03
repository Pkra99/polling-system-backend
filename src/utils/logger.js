import { env } from '../config/env.js';

const LOG_LEVELS = {
  error: 0,
  warn: 1,
  info: 2,
  debug: 3,
};

const COLORS = {
  error: '\x1b[31m', // Red
  warn: '\x1b[33m',  // Yellow
  info: '\x1b[36m',  // Cyan
  debug: '\x1b[35m', // Magenta
  reset: '\x1b[0m',
};

class Logger {
  constructor(level = 'info') {
    this.level = LOG_LEVELS[level] || LOG_LEVELS.info;
  }

  formatMessage(level, message, meta = {}) {
    const timestamp = new Date().toISOString();
    const color = COLORS[level];
    const reset = COLORS.reset;
    
    let output = `${color}[${timestamp}] [${level.toUpperCase()}]${reset} ${message}`;
    
    if (Object.keys(meta).length > 0) {
      output += `\n${JSON.stringify(meta, null, 2)}`;
    }
    
    return output;
  }

  log(level, message, meta = {}) {
    if (LOG_LEVELS[level] <= this.level) {
      console.log(this.formatMessage(level, message, meta));
    }
  }

  error(message, meta = {}) {
    this.log('error', message, meta);
  }

  warn(message, meta = {}) {
    this.log('warn', message, meta);
  }

  info(message, meta = {}) {
    this.log('info', message, meta);
  }

  debug(message, meta = {}) {
    this.log('debug', message, meta);
  }
}

export const logger = new Logger(env.LOG_LEVEL);