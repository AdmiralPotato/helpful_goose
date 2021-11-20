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
      const bodyDegrees = ((user.angle + Math.PI) / window.tau) * 360
      const pointerDegrees = (user.inputAngle / window.tau) * 360
      const eyeSlideX = user.angle < 0
        ? Math.cos(user.angle) * -1
        : Math.cos(user.angle) * 1
      const eyeSlideXDistance = 1
      const eyeSlideY = Math.sin(user.angle) * 0.5
      return Object.assign(
        {},
        user,
        {
          bodyDirection: (Math.abs(user.angle) > (Math.PI * 0.5)) ? 1 : -1,
          degrees: degrees,
          headTransform: `rotate(${degrees})`,
          leftEyeTransform: `
            translate(${eyeSlideX - eyeSlideXDistance} ${eyeSlideY})
          `,
          rightEyeTransform: `
            translate(${eyeSlideX + eyeSlideXDistance} ${eyeSlideY})
          `,
          bodyTransform: `rotate(${bodyDegrees})`,
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
          stroke="#000"
          stroke-width="0.25"
          stroke-linejoin="round"
          stroke-linecap="round"
          :transform="'translate(0,2.25)' + cursor.bodyTransform"
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
          stroke-width="0.5"
          stroke-linejoin="round"
          stroke-linecap="round"
        />
        <use
          href="#goose-head"
        />
      </g>
      <g
        class="cropped-eyes"
        clip-path="url(#goose-head-mask)"
      >
        <use
          href="#goose-eye"
          :transform="cursor.leftEyeTransform"
        />
        <use
          href="#goose-eye"
          :transform="cursor.rightEyeTransform"
        />
        <use
          href="#goose-pupil"
          :transform="cursor.leftEyeTransform + cursor.pointerTransform"
        />
        <use
          href="#goose-pupil"
          :transform="cursor.rightEyeTransform + cursor.pointerTransform"
        />
      </g>
      <use
        href="#goose-pointer"
        :transform="cursor.pointerTransform"
      />
    </g>
  `
})