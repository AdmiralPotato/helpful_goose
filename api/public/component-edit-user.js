window.Vue.component('edit-user', {
  template: /* html */ `
    <div class="edit-user">
      <div class="input-block">
        <label>
          <span>Name</span>
          <input
            v-model="user.name"
          />
        </label>
      </div>
      <div class="input-block">
        <label>
          <span>Color</span>
          <input
            type="color"
            v-model="user.color"
          />
        </label>
      </div>
      <div class="input-block">
        <label>
          <span>Input</span>
          <select
            v-model="user.controller"
          >
            <option
              v-for="option in controlOptions"
            >{{option}}</option>
          </select>
        </label>
      </div>
      <div>
        <button
          @click="cancel"
        >cancel</button>
        <button
          @click="save"
        >save</button>
      </div>
    </div>
  `,
  props: {
    inputUser: {
      type: Object,
      required: false
    }
  },
  data: function () {
    return {
      connectedGamepads: window.gamepadSampler.controllerIdsConnectedRightNow,
      user: this.inputUser || {
        id: window.randomHash(4),
        name: 'Goose',
        color: '#ffffff',
        controller: window.INPUT_TYPE_MOUSETOUCH,
        connected: false
      }
    }
  },
  computed: {
    controlOptions () {
      const connectedGamepads = this.connectedGamepads
      let result = [
        window.INPUT_TYPE_MOUSETOUCH
      ]
      if (connectedGamepads.length) {
        result = result.concat(connectedGamepads)
      }
      return result
    }
  },
  methods: {
    cancel () {
      console.error('Cancel has been selected!')
      this.$emit('cancel')
    },
    save () {
      console.log('Save has been selected!')
      this.$emit('save', this.user)
    }
  }
})
