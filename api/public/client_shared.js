window.randomHash = function (length) {
  const output = []
  for (let i = 0; i < length; i++) {
    output.push(
      Math.round(Math.random() * 36).toString(36)
    )
  }
  return output.join('')
}

window.INPUT_TYPE_MOUSETOUCH = 'mouse/touch'

window.tau = Math.PI * 2
