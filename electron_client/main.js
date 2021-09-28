const {
  app,
  BrowserWindow
} = require('electron')
console.log('GOOSE TIME', {
  app,
  BrowserWindow
})

function createWindow (whenReadyEvent) {
  const win = new BrowserWindow({
    width: 256,
    height: 256
  })
  console.log('appReady!', {
    win,
    whenReadyEvent
  })

  win.loadFile('./index.html')
    .then((windowLoadEventData) => {
      console.log('Window loaded!', {
        windowLoadEventData
      })
    })
}

app.whenReady()
  .then(createWindow)

app.on('window-all-closed', (closeEvent) => {
  console.log('ME HAVE BEEN MURDERED!!', {
    closeEvent
  })
  app.quit()
})
