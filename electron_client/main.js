require('dotenv').config()
const path = require('path')
const base64ArrayBuffer = require('base64-arraybuffer')
const structures = require('./shared/structures')
const {
  BrowserWindow,
  Menu,
  Tray,
  app,
  ipcMain,
  screen,
  desktopCapturer
} = require('electron')
const ioClient = require('socket.io-client')
const socketHostAddress = process.env.API_HOST || 'http://localhost:3000/'

// should match `win32`, `win64`, but not `darwin`
const iconType = (process.platform.indexOf('win') === -1) ? '.ico' : '.png'
const windowIconPath = path.join(__dirname, '/images/helpful_goose-icon' + iconType)
const trayIconPath = path.join(__dirname, '/images/helpful_goose-tray-16' + iconType)

const mainViewPath = './views/electron_browser.html'
const screenSelectPath = './views/screen_select.html'
const sessionLinkPath = './views/session_link.html'

const webPreferences = {
  preload: path.resolve('./preload.js'),
  nodeIntegration: false,
  contextIsolation: true,
  enableRemoteModule: false
}

let screenIndex = 0
let overlayWindow = null

let boundsLoopInterval = null
function getScreenBounds () {
  const displays = screen.getAllDisplays()
  const currentDisplay = displays[screenIndex]
  if (!currentDisplay) {
    clearInterval(boundsLoopInterval)
    openScreenSelectWindow()
  } else {
    return {
      ...currentDisplay.bounds
      // width: Math.round(temp.width / 2)
    }
  }
}
function setupBoundsLoop (socket) {
  if (boundsLoopInterval) {
    clearInterval()
  }
  boundsLoopInterval = setInterval(
    () => {
      updateBounds(socket)
    },
    1000 / 60
  )
}

let lastBounds = {
  x: 0,
  y: 0,
  width: 10,
  height: 10
}
let lastBoundsString = JSON.stringify(lastBounds)
let lastBoundsRelativeString = JSON.stringify(lastBounds)
function sendLastBounds () {
  if (overlayWindow) {
    overlayWindow.webContents.executeJavaScript(
      `updateBounds(${lastBoundsRelativeString})`
    )
  }
}
function updateBounds (socket) {
  const bounds = getScreenBounds()
  if (bounds) {
    const deviceRelativeBounds = {
      ...bounds,
      x: 0,
      y: 0
    }
    const dataString = JSON.stringify(bounds)
    const dataRelativeString = JSON.stringify(deviceRelativeBounds)
    if (dataString !== lastBoundsString) {
      // move the window if screen changed in OS layout
      if (overlayWindow) {
        overlayWindow.setBounds(bounds)
      }
      lastBounds = bounds
      lastBoundsString = dataString
    }
    if (dataRelativeString !== lastBoundsRelativeString) {
      // send messages/resize if it actually changed resolution
      lastBoundsRelativeString = dataRelativeString
      socket.emit('bounds', deviceRelativeBounds)
      sendLastBounds()
    }
  }
}

let lastUsersString = '[]'
function sendLastUsers () {
  if (overlayWindow) {
    overlayWindow.webContents.executeJavaScript(
      `updateUsers(${lastUsersString})`
    )
  }
}
function updateUsers (users) {
  const dataString = JSON.stringify(users)
  if (dataString !== lastUsersString) {
    lastUsersString = dataString
    sendLastUsers()
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
  socket.on('connect', (connectError) => {
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
    const sessionLinkWindow = new BrowserWindow({
      width: 768,
      height: 128,
      frame: false,
      resizable: false,
      icon: windowIconPath,
      transparent: true
    })
    sessionLinkWindow.loadFile(sessionLinkPath)
      .then(() => {
        sessionLinkWindow.webContents.executeJavaScript(
          `updateLink("${socketHostAddress}?sessionId=${sessionId}")`
        )
      }).catch((error) => {
        console.error(error)
      })
  })
  let completeGameState = {
    users: []
  }
  structures.attachStructureListeners(
    socket,
    base64ArrayBuffer,
    {
      update: (socket, users) => {
        structures.mergeCompleteStateWithPartialState(
          completeGameState,
          { users }
        )
        updateUsers(
          completeGameState.users
        )
      },
      complete: (socket, _completeGameState) => {
        completeGameState = _completeGameState
        updateUsers(
          completeGameState.users
        )
      }
    }
  )
  socket.connect()
  return socket
}

let tray = null
function createTrayMenu () {
  tray = new Tray(trayIconPath)
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Helpful Goose', icon: trayIconPath, enabled: false },
    { type: 'separator' },
    { label: 'Select Screen', click: openScreenSelectWindow },
    { type: 'separator' },
    { label: 'Quit', click () { app.quit() } }
  ])
  tray.setToolTip('Helpful Goose')
  tray.setContextMenu(contextMenu)
  tray._contextMenu = contextMenu
  return tray
}

ipcMain.on('overlayLoaded', () => {
  // for when the electron browser window refreshes, send data it should already have had
  sendLastBounds()
  sendLastUsers()
})
function startOverlay (socket) {
  const bounds = getScreenBounds()
  overlayWindow = new BrowserWindow({
    x: bounds.x,
    y: bounds.y,
    width: bounds.width,
    height: bounds.height,
    frame: false,
    transparent: true,
    resizable: false,
    alwaysOnTop: true,
    hasShadow: false,
    icon: windowIconPath,
    webPreferences
  })
  overlayWindow.setIgnoreMouseEvents(true)

  overlayWindow.loadFile(mainViewPath)
    .then(() => {
      console.log('Window loaded!')
      setupBoundsLoop(socket)
    })
  return overlayWindow
}

let screenSelectWindow = null
function sendThumbnailsToScreenSelectWindow () {
  if (screenSelectWindow) {
    return desktopCapturer.getSources({ types: ['screen'] })
      .then((sources) => {
        return sources.map((source) => {
          return source.thumbnail
        })
      })
      .then((thumbnails) => {
        const thumbnailDataUrlStrings = thumbnails.map((thumbnail) => {
          return thumbnail.toDataURL()
        })
        screenSelectWindow.webContents.executeJavaScript(
          `updateThumbnails(${JSON.stringify(thumbnailDataUrlStrings)})`
        )
      })
  }
}
function handleScreenSelect (event, _screenIndex) {
  screenIndex = _screenIndex
  if (screenSelectWindow) {
    screenSelectWindow.close()
    screenSelectWindow = null
  }
}
ipcMain.on(
  'screenSelectLoaded', // send data a gain after refreshes for styling polish
  sendThumbnailsToScreenSelectWindow
)
ipcMain.on(
  'screenSelect',
  handleScreenSelect
)
function openScreenSelectWindow () {
  screenSelectWindow = new BrowserWindow({
    width: 640,
    height: 372,
    frame: false,
    resizable: false,
    icon: windowIconPath,
    transparent: true,
    webPreferences
  })
  screenSelectWindow.loadFile(screenSelectPath)
    .catch((error) => {
      console.error(error)
    })
}

function handleAppReady (whenReadyEvent) {
  console.log('appReady!', {
    whenReadyEvent
  })
  createTrayMenu()
  const socket = initNetwork()
  const displays = screen.getAllDisplays()
  if (displays.length > 1) {
    openScreenSelectWindow()
  }
  startOverlay(socket)
}

app.whenReady()
  .then(handleAppReady)

app.on('window-all-closed', (closeEvent) => {
  console.log('ME HAVE BEEN MURDERED!!', {
    closeEvent
  })
  app.quit()
})

process.on('exit', (code) => {
  if (tray) {
    tray.destroy()
  }
})
