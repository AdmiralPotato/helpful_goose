const base64ArrayBuffer = require('base64-arraybuffer')
const userControls = require('./user_controls.js')
const structures = require('../electron_client/shared/structures.js')
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
      const arrayBuffer = structures.GameState.encode(Object.values(session.userMap))
      room.emit(
        structures.GameState.eventKey,
        base64ArrayBuffer.encode(arrayBuffer)
      )
    },
    updateCompleteGameStateForAllUsers () {
      const arrayBuffer = structures.CompleteGameState.encode({
        cursorRadius: session.cursorRadius,
        bounds: session.bounds,
        users: Object.values(session.userMap)
      })
      room.emit(
        structures.CompleteGameState.eventKey,
        base64ArrayBuffer.encode(arrayBuffer)
      )
    },
    addSocket (socket) {
      session.browserSocketMap[socket.id] = socket
      socket.join(sessionId)
      socket.emit('serverStart', serverStart)
      session.updateCompleteGameStateForAllUsers()
      socket.userMap = {} // this is because there can be multiple participants on each web client
      socket.on('updateUser', (user) => {
        session.updateUser(socket, user)
      })
      socket.on('change', (moveData) => {
        session.controlChange(socket, moveData)
      })
      socket.on('release', (releaseData) => {
        session.controlRelease(socket, releaseData)
      })
      socket.on('action', (actionData) => {
        session.controlAction(socket, actionData)
      })
      socket.on('disconnectUser', (disconnectUserData) => {
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
          action: 0,
          scale: 0.5,
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
        session.updateCompleteGameStateForAllUsers()
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
      session.updateCompleteGameStateForAllUsers()
    },
    bootUser: (user) => {
      user.socket.emit('removeUser', user.id)
      session.removeUser(user)
      session.updateCompleteGameStateForAllUsers()
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
    controlAction: (socket, actionData) => {
      const user = socket.userMap[actionData.id]
      if (user) {
        user.action = actionData.action
        user.lastActiveTime = Date.now()
      } else {
        console.error('Cheating! Someone is trying to action a cursor that is not on their socket!')
      }
    },
    updateBounds (bounds) {
      session.bounds = bounds
      session.updateCompleteGameStateForAllUsers()
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
  console.log(`Session "${sessionId}" was created!`)
  return session
}

module.exports = {
  createInstance
}
