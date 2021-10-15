window.Vue.component('avatar-goose', {
  props: {
    user: {
      type: Object,
      required: true
    }
  },
  computed: {
    cursor () {
      const user = this.user
      const degrees = (user.angle / window.tau) * 360
      const pointerDegrees = (user.inputAngle / window.tau) * 360
      return Object.assign(
        {},
        user,
        {
          bodyDirection: (Math.abs(user.angle) > (Math.PI * 0.5)) ? 1 : -1,
          degrees: degrees,
          headTransform: `rotate(${degrees})`,
          pointerTransform: `rotate(${pointerDegrees})`,
          transform: `
              translate(${user.x} ${user.y})
              scale(${user.radius})
            `
        }
      )
    }
  },
  template: `
    <g
      class="avatar-goose"
      :transform="cursor.transform"
    >
      <g
        class="goose-body"
      >
        <use
          class="goose-neck-outline"
          href="#goose-neck"
          stroke="#000"
          stroke-width="1.25"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <use
          href="#goose-body"
          y="2.25"
          stroke="#000"
          stroke-width="0.5"
          stroke-linejoin="round"
          stroke-linecap="round"
          :transform="'scale(' + cursor.bodyDirection + ' 1)'"
        />
        <use
          class="goose-neck-white"
          href="#goose-neck"
          stroke="#fff"
          stroke-width="0.75"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
      </g>
      <g
        class="head-rotate-group"
        :transform="cursor.headTransform"
      >
        <g
          v-if="cursor.action"
          :transform="'scale(' + cursor.action + ')'"
        >
          <use
            href="#goose-action"
            stroke="#000"
            stroke-width="1.5"
          />
          <use
            href="#goose-action"
            stroke="#fff"
            stroke-width="0.5"
          />
        </g>
        <use
          href="#goose-head"
          stroke="#000"
          stroke-width="1"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <use
          href="#goose-head"
        />
      </g>
      <use
        href="#goose-eye"
        :transform="cursor.pointerTransform"
      />
    </g>
  `
})
