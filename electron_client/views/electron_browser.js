window.app = new window.Vue({
  el: '#app',
  data: {
    bounds: {
      x: 0,
      y: 0,
      width: window.innerWidth,
      height: window.innerHeight
    },
    users: []
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
    yAxisSortedUsers () {
      return window.yAxisSortedUsers(this.users)
    }
  },
  template: `
    <svg
      id="app"
      :view-box.camel="viewBox"
    >
      <shape-defs></shape-defs>
      <g
        class="cursors"
        :transform="'scale(' + bounds.width + ')'"
      >
        <avatar-goose
          v-for="user in yAxisSortedUsers"
          :key="user.id"
          :user="user"
        ></avatar-goose>
      </g>
    </svg>
  `
})

window.updateBounds = (bounds) => {
  window.app.bounds = bounds
}

window.updateUsers = (users) => {
  window.app.users = users
}

window.electron.send('overlayLoaded')
