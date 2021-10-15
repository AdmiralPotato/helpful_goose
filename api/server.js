require('dotenv').config()
const express = require('express')
const app = express()
const http = require('http')
const server = http.Server(app)
const io = require('socket.io')(server)
const sessionManager = require('./session_manager.js')
const path = require('path')
const port = process.env.PORT || 3000

const clientDependencyMap = {
  '/vue': 'node_modules/vue/dist',
  '/nipplejs': 'node_modules/nipplejs/dist',
  '/shared': '../electron_client/shared'
}

app.use('/', express.static('public'))
Object.keys(clientDependencyMap).forEach((key) => {
  app.use(
    key,
    express.static(
      path.resolve(
        path.join(__dirname, clientDependencyMap[key])
      )
    )
  )
})

sessionManager.init(io)

server.listen(port)
console.log(`Starting up server at: http://localhost:${port}/`)
