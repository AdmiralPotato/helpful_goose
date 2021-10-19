window.Vue.component('shape-defs', {
  template: `
    <g class="shape-defs">
      <defs>
        <polygon id="ship" points="1,0 -1,-1 -0.5,0 -1,1" />
        <path id="twinkle" d="M0.2,0.2L-0.2,-0.2Z M-0.2,0.2L0.2,-0.2Z M0.6,0L1,0Z M-0.6,0L-1,0Z M0,0.6L0,1Z M0,-0.6L0,-1Z" />
        <path id="path-arrow" d="M -0,-1 L -1,0 L 0,1 M -1,0 L 1,0" />
        <path id="path-cross" d="M -0.70710678,-0.70710678 L 0.70710678,0.70710678 M 0.70710678,-0.70710678 L -0.70710678,0.70710678" />
        <path id="path-triangle" d="M0,-1 L 0.8660254037844387, 0.4999999999999998 L -0.8660254037844387, 0.4999999999999998 z" />
        <path id="path-square" d="M-0.70710678,-0.70710678 L0.70710678,-0.70710678 L0.70710678,0.70710678L -0.70710678,0.70710678 z" />
        <path id="path-circle" d="M0-1c-0.5522461,0-1,0.4477539-1,1s0.4477539,1,1,1s1-0.4477539,1-1S0.5522461-1,0-1z M0.211792,0.211792" />
        <g id="vert">
          <path-circle class="hit" :r="1" />
          <use xlink:href="#dot" />
        </g>
        <g id="dot">
          <path-circle class="fill" :r="0.0125" />
        </g>
        <path
          id="petal"
          transform="translate(-1,-1)"
          d="M2,1A1.01269,1.01269,0,0,0,1.99484.89776.99969.99969,0,0,0,1.97968.79847L1.97033.75724A.0535.0535,0,0,0,1.90257.719L1.526.83623a.0537.0537,0,0,0-.03622.06251c0,.00017.006.03333.00768.05014a.50773.50773,0,0,1,0,.10224c-.00171.01681-.00764.05-.00768.05014a.0537.0537,0,0,0,.03622.06251l.37661.11726a.0535.0535,0,0,0,.06776-.03827l.00935-.04123a.99969.99969,0,0,0,.01516-.09929A1.01269,1.01269,0,0,0,2,1Z"
        />
        <g
          id="goose-head"
          transform="scale(0.5)"
        >
          <path
            id="triangle"
            fill="#fc8b34"
            d="
              M 1.21 -1.21
              L 4 0
              L 1.21 1.21
            "
          />
            <ellipse
              fill="#fff"
              rx="2"
              ry="2"
            />
            <ellipse
              fill="#000"
              rx="1"
              ry="1"
            />
        </g>
        <g
          id="goose-body"
          transform="scale(0.5)"
        >
          <ellipse
            fill="#fff"
            cx="1.25"
            rx="2.5"
            ry="1.5"
          />
        </g>
        <g
          id="goose-eye"
          transform="scale(0.5)"
        >
          <ellipse
            fill="#fff"
            cx="0.4"
            rx="0.3"
            ry="0.3"
          />
          <path
            id="triangle"
            fill="#fc8b34"
            stroke="#fc8b34"
            stroke-width="0.25"
            stroke-linejoin="round"
            stroke-linecap="round"
            d="
              M 5 -0.5
              L 5.5 0
              L 5 0.5
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
