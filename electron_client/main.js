const {
  app,
  BrowserWindow,
  screen
} = require('electron')
console.log('GOOSE TIME', {
  app,
  BrowserWindow
})

const windowSize = 256
const screenMotionFraction = 1 / 2
const tau = Math.PI * 2

function moveWindow (browserWindow) {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize
  const time = Date.now() / 1000
  const phase = time / 5
  const centerX = width / 2
  const centerY = height / 2
  const smallerAxis = Math.min(
    centerX,
    centerY
  )
  const motionRadius = smallerAxis * screenMotionFraction
  const halfWindowSize = windowSize / 2
  browserWindow.setBounds({
    x: Math.round(centerX - halfWindowSize + (Math.cos(phase * tau) * motionRadius)),
    y: Math.round(centerY - halfWindowSize + (Math.sin(phase * tau) * motionRadius)),
    width: windowSize,
    height: windowSize
  })
}

function createWindow (whenReadyEvent) {
  const browserWindow = new BrowserWindow({
    width: windowSize,
    height: windowSize,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true
  })
  console.log('appReady!', {
    win: browserWindow,
    whenReadyEvent
  })

  browserWindow.loadFile('./index.html')
    .then((windowLoadEventData) => {
      console.log('Window loaded!', {
        windowLoadEventData
      })
      setInterval(
        () => {
          moveWindow(browserWindow)
        },
        1000 / 60
      )
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
