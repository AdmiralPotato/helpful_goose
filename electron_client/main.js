require('dotenv').config()
const path = require('path')
const {
  app,
  BrowserWindow,
  ipcMain,
  screen
} = require('electron')
const ioClient = require('socket.io-client')
const socketHostAddress = process.env.API_HOST || 'http://localhost:3000/'

function getScreenBounds () {
  const temp = screen.getPrimaryDisplay().bounds
  return {
    ...temp
    // width: Math.round(temp.width / 2)
  }
}

let lastBounds = {
  x: 0,
  y: 0,
  width: 10,
  height: 10
}
let lastBoundsString = JSON.stringify(lastBounds)
function sendLastBounds (browserWindow) {
  browserWindow.webContents.executeJavaScript(
    `updateBounds(${lastBoundsString})`
  )
}
function updateBounds (browserWindow, socket) {
  const bounds = getScreenBounds()
  const dataString = JSON.stringify(bounds)
  if (dataString !== lastBoundsString) {
    browserWindow.setBounds(bounds)
    socket.emit('bounds', bounds)
    lastBounds = bounds
    lastBoundsString = dataString
    sendLastBounds(browserWindow)
  }
}

let lastUsersString = '{}'
function sendLastUsers (browserWindow) {
  browserWindow.webContents.executeJavaScript(
    `updateUsers(${lastUsersString})`
  )
}
function updateUsers (browserWindow, users) {
  const dataString = JSON.stringify(users)
  if (dataString !== lastUsersString) {
    browserWindow.webContents.executeJavaScript(
      `updateUsers(${dataString})`
    )
    lastUsersString = dataString
    sendLastUsers(browserWindow)
  }
}

function initNetwork () {
  const socket = ioClient(
    socketHostAddress,
    {
      autoConnect: false,
      auth: {
        client: 'electron'
      }
    }
  )
  socket.on('disconnect', (disconnectReason) => {
    console.log(
      'network.client disconnected from server:',
      {
        socketHostAddress,
        disconnectReason
      }
    )
  })
  socket.on('welcome', (sessionId) => {
    socket.emit('bounds', lastBounds)
    console.log(
      'network.client joined server:',
      JSON.stringify({
        socketHostAddress,
        sessionId
      })
    )
    const sessionIdBrowserWindow = new BrowserWindow({
      width: 768,
      height: 128,
      frame: false,
      transparent: true
    })
    sessionIdBrowserWindow.loadFile('./session_link.html')
      .then(() => {
        sessionIdBrowserWindow.webContents.executeJavaScript(
          `updateLink("${socketHostAddress}?sessionId=${sessionId}")`
        )
      }).catch((error) => {
        console.error(error)
      })
  })
  socket.connect((connectError) => {
    if (connectError) {
      console.log(
        'network.client connectError!',
        connectError
      )
    } else {
      console.log(
        'network.client connected!'
      )
    }
  })
  return socket
}

function handleAppReady (whenReadyEvent) {
  const socket = initNetwork()
  const bounds = getScreenBounds()
  const browserWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    webPreferences: {
      preload: path.resolve('./preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      enableRemoteModule: false
    }
  })
  browserWindow.setIgnoreMouseEvents(true)

  ipcMain.on('loaded', () => {
    // for when the electron browser window refreshes, send data it should already have had
    sendLastBounds(browserWindow)
    sendLastUsers(browserWindow)
  })

  console.log('appReady!', {
    win: browserWindow,
    whenReadyEvent
  })

  browserWindow.loadFile('./electron_browser.html')
    .then(() => {
      console.log('Window loaded!')
      setInterval(
        () => {
          updateBounds(browserWindow, socket)
        },
        1000 / 60
      )
      socket.on('users', (users) => {
        updateUsers(
          browserWindow,
          users
        )
      })
    })
}

app.whenReady()
  .then(handleAppReady)

app.on('window-all-closed', (closeEvent) => {
  console.log('ME HAVE BEEN MURDERED!!', {
    closeEvent
  })
  app.quit()
})
