const controls = {}
controls.tau = Math.PI * 2
controls.ticksPerSecond = 60
controls.mapRange = (a, b, x, y, valueAB) => {
  const diff0 = a - b
  const diff1 = x - y
  const valueDiff = (valueAB - b) / diff0
  return y + (valueDiff * diff1)
}
controls.bound = (min, max, value) => {
  return Math.min(max, Math.max(min, value))
}
controls.lerp = (a, b, progress) => {
  return a + ((b - a) * progress)
}
controls.getDistance = (a, b) => {
  const diffX = a.x - b.x
  const diffY = a.y - b.y
  return controls.getLength(diffX, diffY)
}
controls.getLength = (x, y) => { return Math.sqrt((x * x) + (y * y)) }

controls.constrainUserToBounds = (user, bounds) => {
  const ratio = bounds.height / bounds.width
  user.x = controls.bound(0, 1, user.x)
  user.y = controls.bound(0, ratio, user.y)
}
controls.cursorDrag = 0.955
controls.cursorMaxSpeed = 1 / 80
controls.userMaxForceAddedPerFrame = 1 / 2000
controls.tickUsers = (now, users, bounds) => {
  users.forEach(user => {
    user.xVel *= controls.cursorDrag
    user.yVel *= controls.cursorDrag

    if (user.onTime !== null && !user.hit) {
      const timeDiff = now - user.onTime
      const accelerationRampUp = Math.min(1, timeDiff / 1000)
      const userAddedForce = user.inputForce * accelerationRampUp * controls.userMaxForceAddedPerFrame
      const xVel = user.xVel + Math.cos(user.inputAngle) * userAddedForce
      const yVel = user.yVel + Math.sin(user.inputAngle) * userAddedForce
      user.angle = Math.atan2(yVel, xVel)
      user.force = Math.min(controls.getLength(xVel, yVel), controls.cursorMaxSpeed)
      user.xVel = Math.cos(user.angle) * user.force
      user.yVel = Math.sin(user.angle) * user.force
    } else {
      user.force = controls.getLength(user.xVel, user.yVel)
      if (user.hit && (user.force < 0.001)) {
        if (user.onTime !== null) {
          user.onTime = now
        }
        user.hit = false
      }
    }

    user.x += user.xVel
    user.y += user.yVel

    controls.constrainUserToBounds(user, bounds)
  })
}

module.exports = controls
