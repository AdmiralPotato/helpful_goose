const app = new window.Vue({
  el: '#app',
  data: {
    displays: [],
    displayId: null,
    showError: false
  },
  methods: {
    select (id) {
      this.showError = false
      this.displayId = id
    },
    save () {
      const id = this.displayId
      if (id !== null) {
        window.electron.send('screenSelect', id)
      } else {
        this.showError = true
      }
    }
  }
})

window.updateDisplays = (displays) => {
  app.displays = displays
}

window.electron.send('screenSelectLoaded')
