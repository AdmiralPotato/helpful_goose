window.attachTouchInputToUser = (socket, user) => {
  const joystickOptions = {
    zone: document.getElementById('appTarget'),
    color: '#fff',
    size: Math.min(window.innerWidth, window.innerHeight) * 0.25,
    threshold: 0.1,
    multitouch: false,
    maxNumberOfNipples: 1,
    dataOnly: false,
    restOpacity: 0.125
  }

  const keyDownListener = (event) => {
    if (event.key === ' ') {
      event.preventDefault()
      socket.emit('action', {
        id: user.id,
        action: 1
      })
    }
  }

  const keyUpListener = (event) => {
    if (event.key === ' ') {
      event.preventDefault()
      socket.emit('action', {
        id: user.id,
        action: 0
      })
    }
  }

  const moveListener = (allJoystickValues, currentJoystickValues) => {
    user.force = currentJoystickValues.force
    user.angle = currentJoystickValues.angle.radian
    socket.emit(
      'change',
      {
        id: user.id,
        force: user.force,
        angle: user.angle
      }
    )
  }

  const endListener = () => {
    socket.emit('release', { id: user.id })
  }

  document.body.addEventListener('keydown', keyDownListener, true)
  document.body.addEventListener('keyup', keyUpListener, true)
  const touchInput = window.nipplejs.create(joystickOptions)
  touchInput.on('move', moveListener)
  touchInput.on('end', endListener)

  user.disconnectController = () => {
    document.body.removeEventListener('keydown', keyDownListener, true)
    document.body.removeEventListener('keyup', keyUpListener, true)
    touchInput.off('move', moveListener)
    touchInput.off('end', endListener)
    touchInput.destroy()
  }
}
