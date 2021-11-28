window.Vue.component('shape-defs', {
  template: `
    <g class="shape-defs">
      <defs>
        <g
          id="goose-head-circle"
        >
          <ellipse
            fill="#fff"
            rx="1"
            ry="1"
          />
        </g>
        <g
          id="goose-head"
        >
          <path
            id="triangle"
            fill="#fc8b34"
            d="
              M 0.605 -0.605
              L 2 0
              L 0.605 0.605
            "
          />
          <use
            xlink:href="#goose-head-circle"
          />
        </g>
        <clipPath id="goose-head-mask">
          <ellipse
            fill="#fff"
            rx="1.1"
            ry="1.1"
          />
        </clipPath>
        <g
          id="goose-body"
        >
          <ellipse
            fill="#fff"
            cx="0.625"
            rx="1.25"
            ry="0.75"
          />
        </g>
        <g
            id="goose-eye"
        >
          <ellipse
            fill="#000"
            rx="0.5"
            ry="0.5"
          />
        </g>
        <g
          id="goose-pupil"
          transform="scale(0.5)"
        >
          <ellipse
            fill="#fff"
            cx="0.4"
            rx="0.3"
            ry="0.3"
          />
        </g>
        <g
          id="goose-pointer"
        >
          <path
            id="triangle"
            fill="#fc8b34"
            stroke="#fc8b34"
            stroke-width="0.125"
            stroke-linejoin="round"
            stroke-linecap="round"
            d="
              M 2.5 -0.25
              L 2.75 0
              L 2.5 0.25
              Z
            "
          />
        </g>
        <path
          id="goose-neck"
          d="
            M 0 0
            L 0 2
          "
        />
        <g
          id="goose-action"
          transform="scale(0.5)"
        >
          <path
            stroke-linejoin="round"
            stroke-linecap="round"
            d="
              M 5 0
              L 8 0
            "
          />
          <path
            stroke-linejoin="round"
            stroke-linecap="round"
            transform="rotate(20)"
            d="
              M 6 0
              L 7.5 0
            "
          />
          <path
            stroke-linejoin="round"
            stroke-linecap="round"
            transform="rotate(-20)"
            d="
              M 6 0
              L 7.5 0
            "
          />
        </g>
      </defs>
    </g>
  `
})
