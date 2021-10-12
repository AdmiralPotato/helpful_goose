const sessionIdRegex = /sessionId=([a-z0-9]*)/gi
const sessionId = (sessionIdRegex.exec(window.location.search) || [])[1]

const socket = window.io.connect(
  '//',
  {
    auth: {
      sessionId
    }
  }
)

window.app = new window.Vue({
  el: '#appTarget',
  data: {
    addUserMode: false,
    localUsers: {},
    bounds: {
      width: 1280,
      height: 720
    },
    userMap: {}
  },
  methods: {
    createLocalUser: function (controller) {
      const id = window.randomHash(5)
      const user = {
        controller: controller,
        id: id,
        connected: false
      }
      const newLocalUsers = Object.assign(
        {},
        window.app.localUsers
      )
      newLocalUsers[controller] = user
      window.app.localUsers = newLocalUsers
      if (controller !== 'touch') {
        window.attachGamepadInputToUser(socket, user)
      }
      console.log(`Created user:${user.id} with controller:${controller}`)
    },
    getUserById: function (id) {
      return Object.values(window.app.localUsers).filter((user) => { return user.id === id }).pop()
    },
    updateUser: function (user) {
      this.addUserMode = false
      this.localUsers[user.controller] = user
      socket.emit(
        'updateUser',
        user
      )
    },
    disconnectUser: function (user) {
      socket.emit('disconnectUser', { id: user.id })
      const newLocalUsers = Object.assign(
        {},
        window.app.localUsers
      )
      delete newLocalUsers[user.controller]
      window.app.localUsers = newLocalUsers
      console.log(`Disconnected user:${user.id} with controller:${user.controller}`)
    },
    removeUser: function (user) {
      user.disconnectController()
      window.Vue.delete(window.app.localUsers, user.controller)
      console.log(`Removed user:${user.id} with controller:${user.controller}`)
    }
  },
  template: `
    <div>
      <page-main
          :userMap="userMap"
          :localUsers="localUsers"
          :bounds="bounds"
      />
      <button
        class="add-user"
        v-if="!addUserMode"
        @click="addUserMode = true"
      >+ Add User</button>
      <edit-user
        v-if="addUserMode"
        @cancel="addUserMode = false"
        @save="updateUser"
      ></edit-user>
    </div>
  `
})

socket.on('confirmUpdateUser', (id) => {
  const user = window.app.getUserById(id)
  if (user) {
    user.connected = true
    if (user.controller === window.INPUT_TYPE_MOUSETOUCH) {
      window.attachTouchInputToUser(socket, user)
    }
  } else {
    console.error('Umm... the server asked us to connect a local user that we do not have.', id)
  }
})

let lastStart
socket.on('serverStart', function (serverStart) {
  if (lastStart && lastStart !== serverStart) {
    socket.close()
    window.location.reload(true)
  } else {
    lastStart = serverStart
  }
})
socket.on('bounds', function (data) {
  console.log('Bounds:', data)
  window.app.bounds = data
})
socket.on('users', function (users) {
  window.app.userMap = users
})

socket.on('removeUser', function (userId) {
  const user = window.app.getUserById(userId)
  if (user) {
    window.app.removeUser(user)
  } else {
    console.error('Umm... the server asked us to disconect a user that we do not have.', userId)
  }
})
