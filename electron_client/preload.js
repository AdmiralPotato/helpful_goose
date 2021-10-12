const {
  contextBridge,
  ipcRenderer
} = require('electron')

contextBridge.exposeInMainWorld(
  'electron',
  {
    send: ipcRenderer.send
  }
)
