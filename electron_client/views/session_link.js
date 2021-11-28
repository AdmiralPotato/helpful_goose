const textElement = document.getElementById('session_link_text')
const buttonElement = document.getElementById('session_link')

window.updateLink = (linkAddress) => {
  buttonElement.innerText = linkAddress
  textElement.value = linkAddress
}

buttonElement.addEventListener('click', () => {
  textElement.select()
  document.execCommand('copy')
  buttonElement.innerText = 'Copied!'
  setTimeout(
    window.close,
    500
  )
})

window.electron.send('sessionLinkLoad')
