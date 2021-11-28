require('dotenv').config()
const path = require('path')
const base64ArrayBuffer = require('base64-arraybuffer')
const structures = require('./shared/structures')
const {
  BrowserWindow,
  Menu,
  Tray,
  app,
  clipboard,
  desktopCapturer,
  ipcMain,
  screen
} = require('electron')
const ioClient = require('socket.io-client')
const socketHostAddress = process.env.API_HOST || 'http://localhost:3000/'

// should match `win32`, `win64`, but not `darwin`
const iconType = (process.platform.indexOf('win') === 0) ? '.ico' : '.png'
const windowIconPath = path.join(__dirname, '/images/helpful_goose-icon' + iconType)
const trayIconPath = path.join(__dirname, '/images/helpful_goose-tray-16.png')

const mainView = './views/electron_browser.html'
const screenSelectView = './views/screen_select.html'
const sessionLinkView = './views/session_link.html'

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

let sessionLink = ''
let sessionLinkWindow = null
function handleSessionLinkLoad () {
  sessionLinkWindow.webContents.executeJavaScript(
    `updateLink("${sessionLink}")`
  )
}
function copySessionLink () {
  clipboard.writeText(sessionLink)
}
ipcMain.on(
  'sessionLinkLoad',
  handleSessionLinkLoad
)
let socket = null
function initNetwork () {
  socket = ioClient(
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
      rebuildTrayMenu({
        copySessionLink: { enabled: true },
        sessionStatus: { label: 'Status: Connected' },
        changeStatus: { label: 'Disconnect' }
      })
      console.log(
        'network.client connected!'
      )
    }
  })
  socket.on('connect_error', (/* error */) => {
    rebuildTrayMenu({
      copySessionLink: { enabled: false },
      sessionStatus: { label: 'Status: Connection Error - reconnecting' },
      changeStatus: { label: 'Disconnect' }
    })
  })
  socket.on('disconnect', (disconnectReason) => {
    rebuildTrayMenu({
      copySessionLink: { enabled: false },
      sessionStatus: { label: 'Status: Disconnected' },
      changeStatus: { label: 'Connect' }
    })
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
    sessionLinkWindow = new BrowserWindow({
      width: 768,
      height: 128,
      frame: false,
      resizable: false,
      icon: windowIconPath,
      transparent: true,
      webPreferences
    })
    sessionLink = `${socketHostAddress}?sessionId=${sessionId}`
    rebuildTrayMenu({
      copySessionLink: { enabled: true },
      sessionStatus: { label: 'Status: Connected' },
      changeStatus: { label: 'Disconnect' }
    })
    sessionLinkWindow.loadFile(sessionLinkView)
      .catch((error) => {
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

function toggleSession () {
  if (socket) {
    if (socket.connected) {
      socket.disconnect()
      rebuildTrayMenu({
        sessionStatus: { label: 'Status: User Disconnected' },
        changeStatus: { label: 'Connect' }
      })
    } else {
      socket.connect()
      rebuildTrayMenu()
    }
  }
}

let tray = null
function createTray () {
  tray = new Tray(trayIconPath)
  tray.setToolTip('Helpful Goose')
  rebuildTrayMenu()
}

// menu items may not be mutated after creation, so the simplest solution
// seems to be to replace the whole context menu when a change is required.
function rebuildTrayMenu (options) {
  const overlap = options || {}
  const keyedTemplate = {
    header: { label: 'Helpful Goose', icon: trayIconPath, enabled: false },
    sep0: { type: 'separator' },
    sessionStatus: { label: 'Status: Starting', enabled: false },
    changeStatus: { label: 'Disconnect', click: toggleSession },
    copySessionLink: { label: 'Copy Session Link', click: copySessionLink, enabled: false },
    sep1: { type: 'separator' },
    selectScreen: { label: 'Select Screen', click: openScreenSelectWindow },
    sep2: { type: 'separator' },
    a: { label: 'Quit', click () { app.quit() } }
  }
  Object.entries(overlap).forEach(([key, value]) => {
    Object.assign(
      keyedTemplate[key],
      value
    )
  })
  const contextMenu = Menu.buildFromTemplate(Object.values(keyedTemplate))
  tray.setContextMenu(contextMenu)
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

  overlayWindow.loadFile(mainView)
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
  screenSelectWindow.loadFile(screenSelectView)
    .catch((error) => {
      console.error(error)
    })
}

function handleAppReady (whenReadyEvent) {
  console.log('appReady!', {
    whenReadyEvent
  })
  createTray()
  initNetwork()
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
