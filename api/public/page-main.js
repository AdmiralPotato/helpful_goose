window.Vue.component('page-main', {
  props: {
    userMap: Object,
    localUsers: Object,
    bounds: Object,
    showColorPicker: Boolean
  },
  computed: {
    localUserIds () {
      return Object.values(this.localUsers).map((user) => { return user.id })
    },
    viewBox () {
      return [
        0,
        0,
        this.bounds.width,
        this.bounds.height
      ].join(' ')
    }
  },
  methods: {
    isLocalUser (ship) {
      return this.localUserIds.includes(ship.id)
    }
  },
  template: `
    <svg
      class="main-view"
      :viewBox="viewBox"
    >
      <shape-defs></shape-defs>
      <g
        class="cursors"
        :transform="'scale('+bounds.width+')'"
      >
        <avatar-goose
          v-for="user in userMap"
          :user="user"
          :isLocalUser="isLocalUser(user)"
          :key="user.id"
        ></avatar-goose>
      </g>
      <rect
        class="bounding-rect"
        :width="bounds.width"
        :height="bounds.height"
      />
    </svg>
  `
})
