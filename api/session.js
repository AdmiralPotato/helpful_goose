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
    lastTick: null,
    userMap: {},
    tick: () => {
      const now = Date.now()
      if(session.lastTick === null) {
        session.lastTick = now;
      }
      const deltaTime = now - session.lastTick;
      userControls.tickUsers(
        now,
        deltaTime,
        Object.values(session.userMap),
        session.bounds
      )
      session.lastTick = now;
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
      structures.attachStructureListeners(
        socket,
        base64ArrayBuffer,
        {
          change: session.controlChange,
          release: session.controlRelease,
          action: session.controlAction,
          cloak: session.controlCloak,
          eyeContact: session.controlEyeContact
        }
      )
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
        const placementAngle = Math.random() * Math.PI * 2
        const newProperties = {
          x: Math.cos(placementAngle) * placementRadius,
          y: Math.sin(placementAngle) * placementRadius,
          xVel: 0,
          yVel: 0,
          inputMoveAngle: 0,
          inputMoveForce: 0,
          inputAimAngle: null,
          inputAimForce: null,
          inputEyeContactPress: false,
          inputCloakPress: false,
          inputCloakWasPressed: false,
          eyeContact: false,
          targetOpacity: 1,
          opacity: 0,
          bodyAngle: 0,
          headAngle: 0,
          eyeAngle: 0,
          moveForce: 0,
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
        user.inputMoveForce = Math.min(1, moveData.moveForce)
        user.inputMoveAngle = (
          moveData.moveAngle !== undefined
            ? -moveData.moveAngle
            : user.inputMoveAngle
        ) || 0
        user.inputAimForce = null
        user.inputAimAngle = null
        if (moveData.aimAngle !== null && moveData.aimForce !== null) {
          user.inputAimForce = moveData.aimForce
          user.inputAimAngle = moveData.aimAngle
        }
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
    controlCloak: (socket, cloak) => {
      const user = socket.userMap[cloak.id]
      if (user) {
        user.inputCloakPress = cloak.pressed
      } else {
        console.error('Cheating! Someone is trying to action a cursor that is not on their socket!')
      }
    },
    controlEyeContact: (socket, eyeContact) => {
      const user = socket.userMap[eyeContact.id]
      if (user) {
        user.inputEyeContactPress = eyeContact.pressed
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
