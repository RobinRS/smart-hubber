'use strict'

const fs = require('fs')

/**
 * PluginManager class
 * @class PluginManager
 * @description Manages the plugin instances
 * @example const pluginManager = new PluginManager(config, logger)
 * @example pluginManager.init()
 * @example pluginManager.loadPlugin('test', 'plugins/test/') - Runtime Plugin loading
 * @example pluginManager.unloadPlugin('test') - Runtime Plugin unloading
 * @example pluginManager.registerActivity('test', callback, 5000, 'test') - Activity hook for plugin
 * @example pluginManager.unregisterActivity('test') - Unregister activity hook
 * @example pluginManager.setPluginActivity('test', true) - Activate activity hook
*/
class PluginManager {
  constructor (config, logger) {
    this.pluginDir = config.get('plugin').plugin_dir
    this.updateInterval = config.get('plugin').runtime.update_interval
    this.pluginMap = {}
    this.activityInterval = null
    this._activitys = {}
    this.log = logger
    this.cfg = config
  }

  /**
   * @method init
   * @description Loads all plugins from the plugin directory and initializes them
   * @returns {void}
   * @example pluginManager.init()
   */
  init () {
    this.log.info('Initializing plugin manager...')
    this.log.info('Plugin directory: ' + this.pluginDir)
    this.log.info('Update interval: ' + this.updateInterval)

    // Load all plugins from the plugin directory which have a plugin.yml file
    for (const plugin of fs.readdirSync(this.pluginDir)) {
      if (fs.existsSync(this.pluginDir + `/${plugin}/plugin.yml`)) {
        this.log.info('Found plugin.yml for plugin: ' + plugin)
        this.pluginMap[plugin] = {
          configFile: this.pluginDir + `/${plugin}/plugin.yml`,
          status: 'stopped',
          config: {}
        }
        this.loadPlugin(plugin, this.pluginDir + `/${plugin}/`)
      }
    }
    // Start the update task if the update method is set to auto
    if (this.cfg.get('plugin').runtime.update_method === 'auto') {
      this._startUpdateProcess()
    }
    // Start the activity interval for executing the activity hooks
    this._startActivityInterval()
  }

  /**
   * @description Loads a plugin from the plugin directory and initializes it, if the plugin is already loaded it will be reloaded, while loading the plugin all dependencies will be resolved
   * @param {string} plugin - Plugin name
   * @param {string} dir - Plugin directory
   */
  loadPlugin (plugin, dir) {
    // Check if the plugin is previously recorded in the plugin map
    if (this.pluginMap[plugin]) {
      this.log.info('Loading plugin: ' + plugin)
      // Loads the plugin configuration
      this.pluginMap[plugin].status = 'loading'
      this.pluginMap[plugin].config = this.cfg.load(this.pluginMap[plugin].configFile).hubber_plugin

      // Check if the plugin has dependencies and installes them
      this.pluginMap[plugin].status = 'resolving-dependencies'
      for (const dependency of Object.keys(this.pluginMap[plugin].config.dependencies)) {
        if (this.pluginMap[dependency] === undefined) {
          this.log.info('Resolving dependency: ' + dependency)
          this._installDependency(dependency, this.pluginMap[plugin].config.dependencies[dependency])
        }
      }

      // Loads the plugin
      this.pluginMap[plugin].plugin = require('./../../../' + dir + this.pluginMap[plugin].config.entry)
      this.pluginMap[plugin].status = 'init'

      // Sets the livecycle methods for self reference, descriptor, plugin manager, config manager, logger and plugin directory
      this.pluginMap[plugin].plugin.self = () => { return plugin }
      this.pluginMap[plugin].plugin.getDescriptor = () => { return this.pluginMap[plugin].config.descriptor }
      this.pluginMap[plugin].plugin.getPluginManager = () => { return this }
      this.pluginMap[plugin].plugin.getConfigManager = () => { return this.cfg }
      this.pluginMap[plugin].plugin.getLogger = () => { return this.log }
      this.pluginMap[plugin].plugin.getPluginDir = () => { return dir }

      // Sets the methods for registering and unregistering activities
      this.pluginMap[plugin].plugin.registerActivity = (callback, interval, createdBy) => { this.registerActivity(plugin, callback, interval, createdBy) }
      this.pluginMap[plugin].plugin.unregisterActivity = (from) => { this.unregisterActivity(plugin, from) }

      // Initializes the plugin
      this.pluginMap[plugin].plugin.onInit()
      this.pluginMap[plugin].status = 'loaded'
    }
  }

  /**
   * @description Unloads a plugin from the plugin manager
   * @param {string} plugin - Plugin name
   */
  unloadPlugin (plugin) {
    // Check if the plugin is previously recorded in the plugin map
    if (this.pluginMap[plugin]) {
      // Unloads the plugin
      this.log.info('Unloading plugin: ' + plugin)
      this.pluginMap[plugin].status = 'unloading'
      this.pluginMap[plugin].plugin.onUnload()
      this.pluginMap[plugin].status = 'unloaded'
      this.pluginMap[plugin].plugin = null
      this.pluginMap[plugin].status = 'stopped'
    }
  }

  /**
   * @description Give all plugins with the status loaded to the caller
   */
  getLoadedPlugins () {
    const plugins = []
    for (const plugin of Object.keys(this.pluginMap)) {
      if (this.pluginMap[plugin].status === 'loaded') {
        plugins.push(plugin)
      }
    }
    return plugins
  }

  /**
   * @description Access to the winston logger
   * @returns {winston.Logger} - winston logger
   */
  getLogger () {
    return this.log
  }

  /**
   * @description Livecycle method for a plugin to register an activity
   * @param {string} plugin - Plugin name
   * @param {function} callback - Callback function
   * @param {number} interval - Interval in milliseconds
   * @param {string} createdBy - Plugin name of the plugin which created the activity
   */
  registerActivity (plugin, callback, interval, createdBy) {
    this._activitys[plugin] = (this._activitys[plugin] === undefined
      ? { isActive: true, task: [] }
      : this._activitys[plugin])
    const activity = {
      createdBy: (createdBy === undefined ? plugin : createdBy),
      cb: callback,
      ticks: interval,
      lastRun: new Date().getTime()
    }
    this._activitys[plugin].task.push(activity)
  }

  /**
   * @description Livecycle method for a plugin to unregister an activity
   * @param {string} plugin - Plugin name
   * @param {string} from - Plugin name of the plugin which created the activity
   */
  unregisterActivity (plugin, from) {
    this._activitys[plugin].task = this._activitys[plugin].task.filter((activity) => {
      return activity.createdBy !== from
    })
  }

  /**
   * @description Activity interval for executing the activity hooks
   * @private
   */
  _startActivityInterval () {
    this.activityInterval = setInterval(() => {
      for (const plugin of Object.keys(this._activitys)) {
        // Checks if the plugin is currently active
        if (this._activitys[plugin].isActive) {
          for (const activity of this._activitys[plugin].task) {
            // Checks if the activity is due
            if (new Date().getTime() - activity.lastRun >= activity.ticks) {
              // Executes the activity
              activity.cb()
              activity.lastRun = new Date().getTime()
            }
          }
        }
      }
    }, 1000)
  }

  /**
   * @description Activates or deactivates a plugin activities
   * @param {string} plugin - Plugin name
   * @param {boolean} status - Status
   */
  setPluginActivity (plugin, status) {
    if (this.pluginMap[plugin] !== undefined) {
      this._activitys[plugin].isActive = status
    }
  }

  /**
   * @description Stops the activity interval
   * @private
   */
  _stopActivityInterval () {
    clearInterval(this.activityInterval)
  }

  /**
   * @description Stops the update interval
   * @private
   * @todo Implement
   */
  _stopUpdateProcess () {

  }

  /**
   * @description Starts the update interval
   * @private
   * @todo Implement
   */
  _startUpdateProcess () {
    this.updater = setInterval(() => {

    }, this.updateInterval)
  }

  /**
   * @description Installs a dependency from the npm registry
   * @param {string} depPackage - Dependency name
   * @param {string} version - Dependency version
   */
  _installDependency (depPackage, version) {
    const childProcess = require('child_process')
    try {
      const result = childProcess.execSync(`npm install ${depPackage}@${version}`).toString()
      this.log.info(`npm install ${depPackage}@${version}\n${result}`)
    } catch (e) {
      this.log.error(e)
    }
  }
}

module.exports = PluginManager
