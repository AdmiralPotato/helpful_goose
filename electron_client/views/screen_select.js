const app = new window.Vue({
  el: '#app',
  data: {
    thumbnails: [],
    screenIndex: null,
    showError: false
  },
  methods: {
    select (index) {
      this.showError = false
      this.screenIndex = index
    },
    save () {
      const index = this.screenIndex
      if (index !== null) {
        window.electron.send('screenSelect', this.screenIndex)
      } else {
        this.showError = true
      }
    }
  }
})

window.updateThumbnails = (thumbnails) => {
  app.thumbnails = thumbnails
}

window.electron.send('screenSelectLoaded')
