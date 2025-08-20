const saveButton = document.getElementById('save')
saveButton.addEventListener('click', function () {
  window.electron.send('screenSelect')
})
