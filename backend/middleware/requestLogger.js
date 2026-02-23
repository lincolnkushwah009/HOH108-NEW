import logger from '../utils/logger.js'

const requestLogger = (req, res, next) => {
  const start = Date.now()
  res.on('finish', () => {
    const duration = Date.now() - start
    const logData = {
      method: req.method,
      url: req.originalUrl,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip,
      userId: req.user?._id?.toString() || 'anonymous'
    }
    if (res.statusCode >= 400) {
      logger.warn('Request failed', logData)
    } else {
      logger.http('Request completed', logData)
    }
  })
  next()
}

export default requestLogger
