const joystickOptions = {
  zone: document.body,
  color: '#fff',
  size: Math.min(window.innerWidth, window.innerHeight) * 0.25,
  threshold: 0.1,
  multitouch: false,
  maxNumberOfNipples: 1,
  dataOnly: false,
  restOpacity: 0.125
}

window.attachTouchInputToUser = (socket, user) => {
  const touchInput = window.nipplejs.create(joystickOptions)
  const moveListener = (allJoystickValues, currentJoystickValues) => {
    socket.emit(
      'change',
      {
        id: user.id,
        force: currentJoystickValues.force,
        angle: currentJoystickValues.angle.radian
      }
    )
  }

  const endListener = () => {
    socket.emit('release', { id: user.id })
  }

  const disconnectTouch = () => {
    touchInput.off('move', moveListener)
    touchInput.off('end', endListener)
    touchInput.destroy()
  }

  user.disconnectController = disconnectTouch

  touchInput.on('move', moveListener)
  touchInput.on('end', endListener)
}
