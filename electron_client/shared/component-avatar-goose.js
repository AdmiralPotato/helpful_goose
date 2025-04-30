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
      const headDegrees = (user.headAngle / window.tau) * 360
      const bodyDegrees = (user.bodyAngle / window.tau) * 360
      const pointerDegrees = (user.eyeAngle / window.tau) * 360
      const cos = Math.cos(user.headAngle)
      const eyeSlideX = user.headAngle < 0
        ? -cos
        : cos
      const eyeSlideXDistance = 1
      const eyeSlideY = Math.sin(user.headAngle) * 0.5
      return Object.assign(
        {},
        user,
        {
          bodyDirection: Math.abs(user.headAngle) > Math.PI * 0.5 ? 1 : -1,
          headTransform: `rotate(${headDegrees})`,
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
            scale(${user.combinedScale / 8})
          `,
          eyeContact: user.eyeContact,
          style: 'opacity:' + user.opacity.toFixed(2),
          color: user.color
        }
      )
    }
  },
  template: /* svg */ `
    <g
      class="avatar-goose"
      :transform="cursor.transform"
      :style="cursor.style"
    >
      <g
        class="goose-body"
        :fill="cursor.color"
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
          :stroke="cursor.color"
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
          :fill="cursor.color"
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
          :href="cursor.eyeContact ? '#goose-pupil-centered' : '#goose-pupil'"
          :transform="cursor.leftEyeTransform + cursor.pointerTransform"
        />
        <use
          :href="cursor.eyeContact ? '#goose-pupil-centered' : '#goose-pupil'"
          :transform="cursor.rightEyeTransform + cursor.pointerTransform"
        />
      </g>
      <use
        v-if="!cursor.eyeContact"
        href="#goose-pointer"
        :transform="cursor.pointerTransform"
      />
    </g>
  `
})
