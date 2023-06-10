let selectedApp = null
let mouseX, mouseY

if (localStorage.getItem('os') == null) {
  localStorage.setItem('os', JSON.stringify({ windows: {} }))
}

const os = JSON.parse(localStorage.getItem('os'))

document.addEventListener('mousedown', function (e) {
  selectedApp = e.target
})

document.addEventListener('mouseup', function (e) {
  if (selectedApp.classList.contains('window-resize') || selectedApp.classList.contains('window-bar')) {
    const appElement = selectedApp.parentElement.parentElement
    os.windows[appElement.id] = { top: appElement.style.top, left: appElement.style.left, width: appElement.style.width, height: appElement.style.height, open: true }
    localStorage.setItem('os', JSON.stringify(os))
  }
  selectedApp = null
})

window.onload = function () {
  const openApps = document.querySelectorAll('[id^="app-"]')
  for (const app of openApps) {
    if (os.windows[app.id] !== undefined) {
      app.style.top = os.windows[app.id].top
      app.style.left = os.windows[app.id].left
      app.style.width = os.windows[app.id].width
      app.style.height = os.windows[app.id].height
      app.style.display = os.windows[app.id].open ? 'initial' : 'none'
    }
  }
}

document.addEventListener('mousemove', function (e) {
  if (selectedApp != null) {
    const appElement = selectedApp.parentElement.parentElement
    if (selectedApp.classList.contains('window-bar')) {
      const deltaX = mouseX - e.clientX
      const deltaY = mouseY - e.clientY
      appElement.style.top = (parseInt(appElement.style.top.replace('px', '')) - deltaY) + 'px'
      appElement.style.left = (parseInt(appElement.style.left.replace('px', '')) - deltaX) + 'px'
    }
    if (selectedApp.classList.contains('window-resize')) {
      const deltaX = mouseX - e.clientX
      const deltaY = mouseY - e.clientY

      const newWidth = (parseInt(appElement.style.width.replace('px', '')) - deltaX)
      const newHeight = (parseInt(appElement.style.height.replace('px', '')) - deltaY)

      if (newWidth >= 105) {
        appElement.style.width = newWidth + 'px'
        mouseX = e.clientX
      }

      if (newHeight >= 50) {
        appElement.style.height = newHeight + 'px'
        mouseY = e.clientY
      }
    }
  }
  mouseX = e.clientX
  mouseY = e.clientY
})
