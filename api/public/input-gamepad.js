// Based on certain concepts from: https://github.com/luser/gamepadtest

const gamepadSampler = {
  controllers: {},
  controllerIdsConnectedRightNow: [],
  sample () {
    const idsConnectedNow = gamepadSampler.controllerIdsConnectedRightNow
    const getGamepads = (
      navigator.getGamepads ||
      navigator.webkitGetGamepads ||
      (() => [])
    )
    const gamepads = Array.prototype.slice.call(getGamepads.call(navigator))
      .filter((item) => item)
    idsConnectedNow.splice(0, idsConnectedNow.length)
    let gamepadsSampled = 0
    gamepads.forEach((gamepad) => {
      if (gamepad) {
        gamepadsSampled += 1
        const id = 'gamepad-' + gamepad.index + '-' + gamepad.id
        const lastSample = gamepadSampler.controllers[id]
        const currentSample = {
          id: id,
          axes: gamepad.axes || [],
          buttons: gamepad.buttons.map((buttons) => { return buttons.value })
        }
        currentSample.string = JSON.stringify(currentSample)
        if (!lastSample || currentSample.string !== lastSample.string) {
          gamepadEvents.emit('change', currentSample)
        }
        gamepadSampler.controllers[id] = currentSample
        idsConnectedNow.push(id)
      }
    })
    setTimeout(
      gamepadSampler.sample,
      gamepadsSampled ? 1 : 500
    )
  },
  browserSupportsStandardEvents: 'GamepadEvent' in window,
  browserSupportsWebkitEvents: 'WebKitGamepadEvent' in window,
  init () {
    if (
      gamepadSampler.browserSupportsStandardEvents ||
      gamepadSampler.browserSupportsWebkitEvents
    ) {
      gamepadSampler.sample()
      console.log('Gamepad support detected. Enabling active Gamepad sampling.')
    } else {
      console.warn('No Gamepad support detected. Not enabling active Gamepad sampling')
    }
  }
}

const gamepadEvents = {
  controllers: {},
  listenerMap: {
    change: [],
    action: [],
    move: [],
    cloak: [],
    eyeContact: [],
    end: []
  },
  emit (eventName, data) {
    gamepadEvents.listenerMap[eventName].forEach((listener) => { listener(data) })
  },
  addEventListener (eventName, listener) {
    gamepadEvents.listenerMap[eventName].push(listener)
  },
  removeEventListener (eventName, outgoingListener) {
    gamepadEvents.listenerMap[eventName] = gamepadEvents.listenerMap[eventName]
      .filter((listener) => {
        return listener !== outgoingListener
      })
  }
}

const deadzone = 0.075
const convertLowLevelEventToHigherLevelEvent = (event) => {
  const controller = gamepadEvents.controllers[event.id] = gamepadEvents.controllers[event.id] || {
    id: event.id,
    moveX: 0,
    moveY: 0,
    moveCentered: true,
    aimX: 0,
    aimY: 0,
    aimCentered: true,
    angle: 0,
    action: 0,
    cloakPress: false,
    eyeContactPress: false
  }
  const lX = event.axes[0] || 0
  const lY = event.axes[1] || 0
  const rX = event.axes[2] || 0
  const rY = event.axes[3] || 0
  const leftCentered = (
    Math.abs(lX) < deadzone &&
    Math.abs(lY) < deadzone
  )
  const rightCentered = (
    Math.abs(rX) < deadzone &&
    Math.abs(rY) < deadzone
  )
  let wantMoveEvent = false
  let wantEndEvent = false
  const moveX = lX
  const moveY = lY
  const moveCentered = leftCentered
  const aimX = rX
  const aimY = rY
  const aimCentered = rightCentered
  if (
    controller.moveX !== moveX ||
    controller.moveY !== moveY
  ) {
    controller.moveX = moveX
    controller.moveY = moveY
    if (moveCentered && !controller.moveCentered) {
      wantEndEvent = true
    } else if (!moveCentered) {
      wantMoveEvent = true
    }
    controller.moveCentered = moveCentered
  }
  if (
    controller.aimX !== aimX ||
    controller.aimY !== aimY
  ) {
    controller.aimX = aimX
    controller.aimY = aimY
    if (aimCentered && !controller.aimCentered) {
      wantEndEvent = true
    } else if (!aimCentered) {
      wantMoveEvent = true
    }
    controller.aimCentered = aimCentered
  }
  if (wantMoveEvent) {
    gamepadEvents.emit('move', controller)
  } else if (wantEndEvent) {
    gamepadEvents.emit('end', controller)
  }
  const actionLevel = ( // A float value. Variable strength honk.
    event.buttons[0] || // A & ❌
    event.buttons[1] || // B & ⏺
    event.buttons[2] || // X & ■
    event.buttons[3] || // Y & ▲
    event.buttons[4] || // Trigger Left Top
    event.buttons[5] || // Trigger Right Top
    event.buttons[6] || // Trigger Left Bottom
    event.buttons[7] || // Trigger Right Bottom
    event.buttons[9] // Start
  )
  if (controller.action !== actionLevel) {
    // a change has occurred
    // console.log('action', actionLevel)
    controller.action = actionLevel
    gamepadEvents.emit('action', controller)
  }
  const cloakPress = !!event.buttons[10] // Left Stick Click
  if (cloakPress !== controller.cloakPress) {
    controller.cloakPress = cloakPress
    gamepadEvents.emit('cloak', controller);
  }
  const eyeContactPress = !!event.buttons[11] // Right Stick Click
  if (eyeContactPress !== controller.eyeContactPress) {
    controller.eyeContactPress = eyeContactPress
    gamepadEvents.emit('eyeContact', controller);
  }
}

gamepadEvents.addEventListener(
  'change',
  convertLowLevelEventToHigherLevelEvent
)

gamepadSampler.init()

const tau = Math.PI * 2
const deg = tau / 360
window.attachGamepadInputToUser = (inputEmitter, user) => {
  const actionListener = (event) => {
    if (event.id === user.controller) {
      // HONK!!!
      inputEmitter(
        'action',
        {
          id: user.id,
          action: event.action
        }
      )
    }
  }
  const moveListener = (event) => {
    if (event.id === user.controller) {
      const moveAngle = Math.atan2(-event.moveY, event.moveX)
      if (!user.connected) {
        user.moveAngle = ((-moveAngle + tau) % tau) / deg
      } else {
        const moveDistance = Math.sqrt(
          (event.moveX * event.moveX) +
          (event.moveY * event.moveY)
        )
        user.moveForce = Math.min(1, moveDistance * moveDistance)
        let aimAngle = null
        if (event.aimCentered) {
          user.aimForce = null
        } else {
          aimAngle = Math.atan2(event.aimY, event.aimX)
          const aimDistance = Math.sqrt(
            (event.aimX * event.aimX) +
            (event.aimY * event.aimY)
          )
          user.aimForce = Math.min(1, aimDistance * aimDistance)
        }
        inputEmitter(
          'change',
          {
            id: user.id,
            moveForce: user.moveForce,
            moveAngle: moveAngle,
            aimForce: user.aimForce,
            aimAngle: aimAngle
          }
        )
      }
    }
  }
  const cloakListener = (event) => {
    if (event.id === user.controller) {
      inputEmitter(
        'cloak',
        {
          id: user.id,
          pressed: event.cloakPress
        }
      )
    }
  }
  const eyeContactListener = (event) => {
    if (event.id === user.controller) {
      inputEmitter(
        'eyeContact',
        {
          id: user.id,
          pressed: event.eyeContactPress
        }
      )
    }
  }
  const endListener = (event) => {
    if (event.id !== user.controller || !user.connected) { return }
    inputEmitter('release', { id: user.id })
  }

  user.disconnectController = () => {
    gamepadEvents.removeEventListener('action', actionListener)
    gamepadEvents.removeEventListener('move', moveListener)
    gamepadEvents.removeEventListener('cloak', cloakListener)
    gamepadEvents.removeEventListener('eyeContact', eyeContactListener)
    gamepadEvents.removeEventListener('end', endListener)
  }

  gamepadEvents.addEventListener('action', actionListener)
  gamepadEvents.addEventListener('move', moveListener)
  gamepadEvents.addEventListener('cloak', cloakListener)
  gamepadEvents.addEventListener('eyeContact', eyeContactListener)
  gamepadEvents.addEventListener('end', endListener)
}

window.gamepadSampler = gamepadSampler
window.gamepadEvents = gamepadEvents
