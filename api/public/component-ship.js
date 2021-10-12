window.Vue.component('ship', {
  props: {
    id: String,
    x: Number,
    y: Number,
    angle: Number,
    inputAngle: Number,
    radius: Number,
    hue: Number,
    isLocalUser: Boolean,
    hit: Boolean,
    score: [Number, String]
  },
  computed: {
    shipTransforms: function () {
      const transforms = [
        'scale(' + this.radius + ')',
        'rotate(' + ((this.angle / window.tau) * 360) + ')'
      ]
      return transforms.join(',')
    },
    inputAngleTransforms: function () {
      const transforms = [
        'rotate(' + ((this.inputAngle / window.tau) * 360) + ')',
        'translate(' + (this.radius + (this.radius * 0.75)) + ')',
        'scale(' + (this.radius * 0.2) + ')'
      ]
      return transforms.join(',')
    },
    scoreDisplay: function () {
      return this.score ? this.score.toLocaleString() : ''
    }
  },
  template: `
      <g
        class="ship"
        :class="{
          fill: isLocalUser,
          hit: hit
        }"
        :transform="'translate(' + x + ', ' + y + ')'"
        :style="'color: hsla(' + hue + ', 100%, 50%, 1);'"
      >
        <g :transform="shipTransforms">
          <use xlink:href="#ship" />
        </g>
        <g :transform="inputAngleTransforms">
          <use xlink:href="#ship" />
        </g>
        <use :xlink:href="'#ship-overlay-' + id" />
      </g>
    `
})
