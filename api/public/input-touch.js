window.attachTouchInputToUser = (inputEmitter, user) => {
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
      inputEmitter(
        'action',
        {
          id: user.id,
          action: 1
        }
      )
    }
  }

  const keyUpListener = (event) => {
    if (event.key === ' ') {
      event.preventDefault()
      inputEmitter(
        'action',
        {
          id: user.id,
          action: 0
        }
      )
    }
  }

  const moveListener = (allJoystickValues, currentJoystickValues) => {
    user.moveForce = currentJoystickValues.force
    user.moveAngle = currentJoystickValues.angle.radian
    inputEmitter(
      'change',
      {
        id: user.id,
        moveForce: user.moveForce,
        moveAngle: user.moveAngle,
        aimForce: null,
        aimAngle: null
      }
    )
  }

  const endListener = () => {
    inputEmitter('release', { id: user.id })
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
