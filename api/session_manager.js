const sessionControl = require('./session')
const userControls = require('./user_controls')
const shared = require('./shared')

const sessionMap = {}
let sessionIntervalId
let io
const sessionManager = {
  init (_io) {
    io = _io
    // This is when we gain a socket client.
    // Maybe web. Maybe electron.
    io.on('connection', (socket) => {
      const {
        client,
        sessionId
      } = socket.handshake.auth || {}
      console.log(
        'Socket connection!',
        {
          client,
          sessionId
        }
      )
      if (
        client === 'electron'
      ) {
        const sessionId = sessionManager.createSession(socket)
        socket.emit('welcome', sessionId)
      } else if (
        sessionId
      ) {
        const sessionInstance = sessionManager.connectSocketToSessionById(
          socket,
          sessionId
        )
        if (!sessionInstance) {
          socket.emit('error', 'Invalid sessionId')
          socket.disconnect()
        } else {
          socket.emit('welcome', 'I have no idea who you are, but welcome?')
        }
      } else {
        socket.emit('error', 'No client or sessionId')
      }
    })
    sessionManager.startTicking()
  },
  createSession (electronSocket) {
    let sessionId
    let session
    do {
      sessionId = shared.randomHash(10)
      session = sessionMap[sessionId]
      // MUST CREATE NEW! NEVER COLLIDE!!
    } while (session)
    sessionMap[sessionId] = sessionControl.createInstance(
      sessionId,
      electronSocket,
      sessionManager,
      io
    )
    electronSocket.on('disconnect', () => {
      sessionManager.endSession(sessionId)
    })
    return sessionId
  },
  connectSocketToSessionById (socket, sessionId) {
    const sessionInstance = sessionMap[sessionId]
    if (sessionInstance) {
      sessionInstance.addSocket(socket)
    }
    return sessionInstance
  },
  endSession (sessionId) {
    sessionMap[sessionId].endSession()
    delete sessionMap[sessionId]
  },
  tickAllSessions () {
    Object.values(sessionMap)
      .forEach((sessionInstance) => sessionInstance.tick())
  },
  startTicking () {
    sessionIntervalId = setInterval(
      sessionManager.tickAllSessions,
      1000 / userControls.ticksPerSecond
    )
  },
  stopTicking () {
    clearInterval(sessionIntervalId)
  }
}

module.exports = sessionManager
