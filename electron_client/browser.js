const svgElement = document.getElementById('target')
const gooseElement = document.getElementById('goose')

window.move = (config) => {
  window.requestAnimationFrame(() => {
    svgElement.setAttribute(
      'viewBox',
      [
        config.bounds.x,
        config.bounds.y,
        config.bounds.width,
        config.bounds.height
      ].join(' ')
    )
    const scale = config.smallerAxis / 50
    gooseElement.transform.baseVal[0].setTranslate(config.x, config.y)
    gooseElement.transform.baseVal[1].setScale(scale, scale)
    gooseElement.transform.baseVal[2].setRotate(config.angle, 0, 0)
  })
}
