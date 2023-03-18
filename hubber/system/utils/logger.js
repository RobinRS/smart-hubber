const winston = require('winston')

const Initializing = (config) => {
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

  const logger = winston.createLogger({
    format: winston.format.json(),
    transports: [
      new winston.transports.File({ filename: config.type.error.log_file, level: 'error' }),
      new winston.transports.File({ filename: config.type.info.log_file, level: 'info' }),
      new winston.transports.File({ filename: config.type.http.log_file, level: 'http' })
    ]
  })

  if (process.env.NODE_ENV !== 'production') {
    logger.add(new winston.transports.Console({
      format: winston.format.combine(winston.format.colorize(), alignColorsAndTime)
    }))
  }
  return logger
}

module.exports = { init: Initializing }
