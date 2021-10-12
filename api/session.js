const userControls = require('./user_controls.js')
const serverStart = Date.now()

function createInstance (
  sessionId,
  electronClientSocket,
  sessionManager,
  io
) {
  const room = io.to(sessionId)
  const session = {
    cursorRadius: 1 / 80,
    electronClientSocket,
    browserSocketMap: {},
    bounds: {
      x: 0,
      y: 0,
      width: 10,
      height: 10
    },
    userMap: {},
    tick: () => {
      const now = Date.now()
      userControls.tickUsers(
        now,
        Object.values(session.userMap),
        session.bounds
      )
      session.bootUsersThatNeedBooting()
      const filteredUserData = session.prepUserDataForClientSide()
      room.emit('users', filteredUserData)
    },
    maskProps: [
      '',
      'id',
      'x',
      'y',
      'angle',
      'inputAngle'
    ],
    prepUserDataForClientSide: () => {
      const result = {}
      Object.values(session.userMap).forEach((user) => {
        const sanitizedUser = JSON.stringify(user, (key, value) => {
          let result = value
          if (!session.maskProps.includes(key)) {
            result = undefined
          }
          return result
        })
        const parsedUser = JSON.parse(sanitizedUser)
        parsedUser.radius = session.cursorRadius
        result[user.id] = parsedUser
      })
      return result
    },
    addSocket (socket) {
      session.browserSocketMap[socket.id] = socket
      socket.join(sessionId)
      socket.emit('serverStart', serverStart)
      socket.emit('bounds', session.bounds)
      socket.userMap = {} // this is because there can be multiple participants on each web client
      socket.on('updateUser', function (user) {
        session.updateUser(socket, user)
      })
      socket.on('change', function (moveData) {
        session.controlChange(socket, moveData)
      })
      socket.on('release', function (releaseData) {
        session.controlRelease(socket, releaseData)
      })
      socket.on('disconnectUser', function (disconnectUserData) {
        const user = socket.userMap[disconnectUserData.id]
        if (user) {
          session.removeUser(user)
        } else {
          console.error('Cheating! Someone is trying to disconnect a user that is not on their socket!')
        }
      })
      socket.on('disconnect', function () {
        Object.values(socket.userMap).forEach((user) => {
          session.removeUser(user)
        })
      })
    },
    updateUser: (socket, user) => {
      const id = user.id
      const userAlreadyInSession = session.userMap[id]
      const userAlreadyInSocket = socket.userMap[id]
      if (!userAlreadyInSession) {
        const placementRadius = 0.5
        const angle = Math.random() * Math.PI * 2
        const newProperties = {
          x: Math.cos(angle) * placementRadius,
          y: Math.sin(angle) * placementRadius,
          xVel: 0,
          yVel: 0,
          angle: 0,
          inputAngle: 0,
          inputForce: 0,
          force: 0,
          onTime: null,
          socket: socket,
          lastActiveTime: Date.now(),
          needsBooting: false,
          hit: false
        }
        Object.assign(
          user,
          newProperties
        )
        socket.userMap[id] = user
        session.userMap[id] = user
        socket.emit('confirmUpdateUser', user.id)
        console.log(`Connecting user:${id} to socket:${socket.id}`)
      } else if (userAlreadyInSession && userAlreadyInSocket) {
        Object.assign(
          userAlreadyInSocket,
          user
        )
      } else {
        console.error('Cheating! Someone is trying to become another connected user!')
      }
    },
    removeUser: (user) => {
      delete user.socket.userMap[user.id]
      delete user.socket
      delete session.userMap[user.id]
    },
    bootUser: (user) => {
      user.socket.emit('removeUser', user.id)
      session.removeUser(user)
    },
    bootUsersThatNeedBooting: () => {
      Object.values(session.userMap).forEach((user) => {
        if (user.needsBooting) {
          session.bootUser(user)
        }
      })
    },
    controlChange: (socket, moveData) => {
      const user = socket.userMap[moveData.id]
      if (user) {
        const now = Date.now()
        if (!user.onTime) {
          user.onTime = now
        }
        user.lastActiveTime = now
        user.inputForce = Math.min(1, moveData.force)
        user.inputAngle = (
          moveData.angle !== undefined
            ? -moveData.angle
            : user.inputAngle
        ) || 0
      } else {
        console.error('Cheating! Someone is trying to control a cursor that is not on their socket!')
      }
    },
    controlRelease: (socket, releaseData) => {
      const user = socket.userMap[releaseData.id]
      if (user) {
        user.onTime = null
        user.lastActiveTime = Date.now()
      } else {
        console.error('Cheating! Someone is trying to stop a cursor that is not on their socket!')
      }
    },
    updateBounds (bounds) {
      session.bounds = bounds
      room.emit('bounds', session.bounds)
    },
    endSession () {
      room.emit('game_over')
      electronClientSocket.disconnect()
      Object.values(session.browserSocketMap).forEach((socket) => {
        socket.disconnect()
      })
    }
  }
  electronClientSocket.join(sessionId)
  electronClientSocket.on('bounds', session.updateBounds)
  global.session = session
  return session
}

module.exports = {
  createInstance
}
