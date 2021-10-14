const tau = Math.PI * 2

window.app = new window.Vue({
  el: '#app',
  data: {
    bounds: {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    users: {}
  },
  computed: {
    viewBox () {
      return [
        this.bounds.x,
        this.bounds.y,
        this.bounds.width,
        this.bounds.height
      ].join(' ')
    },
    cursors () {
      return Object.entries(this.users).map(([id, user]) => {
        return Object.assign(
          {},
          user,
          {
            pointerTransform: 'rotate(' + (((user.inputAngle - user.angle) / tau) * 360) + ')',
            transform: `
              translate(${user.x} ${user.y})
              rotate(${(user.angle / tau) * 360})
              scale(${user.radius})
            `
          }
        )
      })
    }
  }
})

window.updateBounds = (bounds) => {
  window.app.bounds = bounds
}

window.updateUsers = (users) => {
  window.app.users = users
}

window.electron.send('loaded')
