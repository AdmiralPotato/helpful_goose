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
    x: 0,
    y: 0,
    angle: 0,
    action: 0
  }
  const x = event.axes[0] || 0
  const y = event.axes[1] || 0
  const centered = (
    Math.abs(x) < deadzone &&
    Math.abs(y) < deadzone
  )
  if (
    controller.x !== x ||
    controller.y !== y
  ) {
    controller.x = x
    controller.y = y
    if (centered && !controller.centered) {
      gamepadEvents.emit('end', controller)
    } else if (!centered) {
      gamepadEvents.emit('move', controller)
    }
    controller.centered = centered
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
}

gamepadEvents.addEventListener(
  'change',
  convertLowLevelEventToHigherLevelEvent
)

gamepadSampler.init()

const tau = Math.PI * 2
const deg = tau / 360
window.attachGamepadInputToUser = (socket, user) => {
  const actionListener = (event) => {
    if (event.id === user.controller) {
      // HONK!!!
      socket.emit(
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
      const angle = Math.atan2(-event.y, event.x)
      if (!user.connected) {
        user.angle = ((-angle + tau) % tau) / deg
      } else {
        const distance = Math.sqrt(
          (event.x * event.x) +
          (event.y * event.y)
        )
        user.force = Math.min(1, distance * distance)
        socket.emit(
          'change',
          {
            id: user.id,
            force: user.force,
            angle: angle
          }
        )
      }
    }
  }
  const endListener = (event) => {
    if (event.id !== user.controller || !user.connected) { return }
    socket.emit('release', { id: user.id })
  }

  user.disconnectController = () => {
    gamepadEvents.removeEventListener('action', actionListener)
    gamepadEvents.removeEventListener('move', moveListener)
    gamepadEvents.removeEventListener('end', endListener)
  }

  gamepadEvents.addEventListener('action', actionListener)
  gamepadEvents.addEventListener('move', moveListener)
  gamepadEvents.addEventListener('end', endListener)
}

window.gamepadSampler = gamepadSampler
window.gamepadEvents = gamepadEvents
