const app = new window.Vue({
  el: '#app',
  data: {
    showError: false
  },
  methods: {
    save () {
      window.electron.send('screenSelect')
    }
  }
})

window.updateDisplays = (displays) => {
  app.displays = displays
}

window.electron.send('screenSelectLoaded')
