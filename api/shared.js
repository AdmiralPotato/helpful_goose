module.exports = {
  randomHash (length) {
    const output = []
    for (let i = 0; i < length; i++) {
      output.push(
        Math.round(Math.random() * 36).toString(36)
      )
    }
    return output.join('')
  }
}
