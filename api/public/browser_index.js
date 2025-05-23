const base64ArrayBuffer = window['base64-arraybuffer']
const sessionIdRegex = /sessionId=([a-z0-9]*)/gi
const sessionId = (sessionIdRegex.exec(window.location.search) || [])[1]
const structures = window.gooseBinaryStructures

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
    editingUser: undefined,
    addUserMode: false,
    localUsers: {},
    bounds: {
      width: 1280,
      height: 720
    },
    users: []
  },
  methods: {
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
    disconnectUserFromSocket: function (user) {
      socket.emit('disconnectUser', { id: user.id })
      console.log(`Disconnected user:${user.id} with controller:${user.controller}`)
      this.removeUserFromLocalData(user)
    },
    removeUserFromLocalData: function (user) {
      const newLocalUsers = Object.assign(
        {},
        window.app.localUsers
      )
      delete newLocalUsers[user.controller]
      window.app.localUsers = newLocalUsers
      if (user.disconnectController) {
        user.disconnectController()
      }
      console.log(`Removed user:${user.id} with controller:${user.controller}`)
    }
  },
  template: /* html */ `
    <div id="appTarget">
      <page-main
          :users="users"
          :localUsers="localUsers"
          :bounds="bounds"
      />
      <div
        class="manage-users"
        v-if="!addUserMode"
      >
        <div>
          <button
            class="button-add-user"
            @click="addUserMode = true"
          >+ Add User</button>
        </div>
        <div
          v-for="(localUser, controller) in localUsers"
          :key="controller"
        >
          <button
            class="button-edit-user"
            @click="
              editingUser = localUser;
              addUserMode = true
            "
          >✏️ Edit {{controller}}</button>
          <button
            class="button-delete-user"
            @click="disconnectUserFromSocket(localUser)"
          >x</button>
        </div>
      </div>
      <edit-user
        v-if="addUserMode"
        :user="editingUser"
        @cancel="addUserMode = false"
        @save="updateUser"
      ></edit-user>
    </div>
  `
})

const inputEmitter = structures.createStructureEmitter(socket, base64ArrayBuffer)

socket.on('confirmUpdateUser', (id) => {
  const user = window.app.getUserById(id)
  if (user) {
    user.connected = true
    const attachInput = (
      user.controller === window.INPUT_TYPE_MOUSETOUCH
        ? window.attachTouchInputToUser
        : window.attachGamepadInputToUser
    )
    attachInput(inputEmitter, user)
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

structures.attachStructureListeners(
  socket,
  base64ArrayBuffer,
  {
    update: (socket, users) => {
      structures.mergeCompleteStateWithPartialState(
        window.app,
        { users }
      )
    },
    complete: (socket, complete) => {
      window.app.bounds = complete.bounds
      window.app.users = complete.users
    }
  }
)

socket.on('removeUser', function (userId) {
  const user = window.app.getUserById(userId)
  if (user) {
    window.app.removeUserFromLocalData(user)
  } else {
    console.error('Umm... the server asked us to disconnect a user that we do not have.', userId)
  }
})
