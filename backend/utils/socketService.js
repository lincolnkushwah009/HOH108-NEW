import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import logger from './logger.js'

let io = null

export function initializeSocket(server) {
  io = new Server(server, {
    cors: {
      origin: [
        'http://localhost:5173', 'http://localhost:5174', 'http://localhost:5175',
        'http://localhost:3000', 'https://hoh108.com',
        /^http:\/\/192\.168\.\d{1,3}\.\d{1,3}:\d{4,5}$/
      ],
      credentials: true
    },
    pingTimeout: 60000
  })

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token
    if (!token) return next(new Error('Authentication required'))
    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET)
      socket.userId = decoded.id
      socket.companyId = decoded.companyId
      next()
    } catch {
      next(new Error('Invalid token'))
    }
  })

  io.on('connection', (socket) => {
    socket.join(`user:${socket.userId}`)
    if (socket.companyId) socket.join(`company:${socket.companyId}`)
    logger.info('Socket connected', { userId: socket.userId })

    socket.on('disconnect', () => {
      logger.info('Socket disconnected', { userId: socket.userId })
    })
  })

  logger.info('Socket.IO initialized')
  return io
}

export function getIO() {
  return io
}

export function emitToUser(userId, event, data) {
  if (io) io.to(`user:${userId}`).emit(event, data)
}

export function emitToCompany(companyId, event, data) {
  if (io) io.to(`company:${companyId}`).emit(event, data)
}
