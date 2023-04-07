const winston = require('winston')

/**
 * Initializing winston logger with in config file defined log files
 * @param {ConfigManager} config - ConfigManager instance
 * @returns {winston.Logger} - winston logger instance
 */
const init = (config) => {
  const loggerConfig = config.get('logs')

  // Define the custom settings for console logging
  const alignColorsAndTime = winston.format.combine(
    winston.format.colorize({
      all: true
    }),
    winston.format.timestamp({
      format: 'YY-MM-DD HH:mm:ss'
    }),
    winston.format.printf(
      info => `[${info.timestamp}] ${info.level}: ${info.message}`
    )
  )

  // TODO: add log rotation
  const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: loggerConfig.type.error.log_file, level: 'error' }),
      new winston.transports.File({ filename: loggerConfig.type.info.log_file, level: 'info' }),
      new winston.transports.File({ filename: loggerConfig.type.http.log_file, level: 'http' })
    ]
  })

  // If we're not in production then log to the `console` with the format:
  // `[${info.timestamp}] ${info.level}: ${info.message}`
  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), alignColorsAndTime)
    }))
  }
  return logger
}

module.exports = init
