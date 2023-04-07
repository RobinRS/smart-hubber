const router = require('express').Router()

function registerDefaultWebRouter (pluginManager, config) {
  for (const plugin of pluginManager.getLoadedPlugins()) {
    if (plugin.plugin.getDescriptor().webPath !== undefined) {
      router.use(plugin.plugin.getDescriptor().webPath, plugin._webRouter)
    }
  }
  return router
}

module.exports = registerDefaultWebRouter
