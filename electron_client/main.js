const {
  app,
  BrowserWindow,
  screen
} = require('electron')
console.log('GOOSE TIME', {
  app,
  BrowserWindow
})

const windowSize = 128
const screenMotionFraction = 1 / 2
const tau = Math.PI * 2

let lastMoveData
function moveGoose (browserWindow) {
  const bounds = screen.getPrimaryDisplay().bounds
  const time = Date.now() / 1000
  const phase = time / 5
  const centerX = bounds.width / 2
  const centerY = bounds.height / 2
  const smallerAxis = Math.min(
    centerX,
    centerY
  )
  const motionRadius = smallerAxis * screenMotionFraction
  const halfWindowSize = windowSize / 2
  browserWindow.setBounds(bounds)
  const angle = phase * tau
  const moveData = {
    smallerAxis,
    bounds,
    x: centerX - halfWindowSize + (Math.cos(angle) * motionRadius),
    y: centerY - halfWindowSize + (Math.sin(angle * 2) * motionRadius / 2),
    angle: 0
  }
  if (lastMoveData) {
    const diffX = moveData.x - lastMoveData.x
    const diffY = moveData.y - lastMoveData.y
    moveData.angle = ((-Math.atan2(diffX, diffY) / tau * 360) + 90) % 360
  }
  lastMoveData = moveData
  browserWindow.webContents.executeJavaScript(`
    move(${JSON.stringify(moveData)})
  `)
}

function createWindow (whenReadyEvent) {
  const bounds = screen.getPrimaryDisplay().bounds
  const browserWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true
  })
  browserWindow.setIgnoreMouseEvents(true)
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
          moveGoose(browserWindow)
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
