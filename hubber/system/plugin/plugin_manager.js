'use strict'

const fs = require('fs')

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

  init () {
    this.log.info('Initializing plugin manager...')
    this.log.info('Plugin directory: ' + this.pluginDir)
    this.log.info('Update interval: ' + this.updateInterval)

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
    if (this.cfg.get('plugin').runtime.update_method === 'auto') {
      this._startUpdateProcess()
    }
    this._startActivityInterval()
  }

  loadPlugin (plugin, dir) {
    if (this.pluginMap[plugin]) {
      this.log.info('Loading plugin: ' + plugin)
      this.pluginMap[plugin].status = 'loading'
      this.pluginMap[plugin].config = this.cfg.load(this.pluginMap[plugin].configFile).hubber_plugin
      this.pluginMap[plugin].status = 'resolving-dependencies'
      for (const dependency of Object.keys(this.pluginMap[plugin].config.dependencies)) {
        if (this.pluginMap[dependency] === undefined) {
          this.log.info('Resolving dependency: ' + dependency)
          this._installDependency(dependency, this.pluginMap[plugin].config.dependencies[dependency])
        }
      }
      this.pluginMap[plugin].plugin = require('./../../../' + dir + this.pluginMap[plugin].config.entry)
      this.pluginMap[plugin].status = 'init'
      this.pluginMap[plugin].plugin.self = () => { return plugin }
      this.pluginMap[plugin].plugin.getPluginManager = () => { return this }
      this.pluginMap[plugin].plugin.getConfigManager = () => { return this.cfg }
      this.pluginMap[plugin].plugin.getLogger = () => { return this.log }
      this.pluginMap[plugin].plugin.getPluginDir = () => { return dir }
      this.pluginMap[plugin].plugin.registerActivity = (callback, interval, createdBy) => { this.registerActivity(plugin, callback, interval, createdBy) }
      this.pluginMap[plugin].plugin.unregisterActivity = (from) => { this.unregisterActivity(plugin, from) }
      this.pluginMap[plugin].plugin.getDescriptor = () => { return this.pluginMap[plugin].config.descriptor }
      this.pluginMap[plugin].plugin.onInit()
      this.pluginMap[plugin].status = 'loaded'
    }
  }

  unloadPlugin (plugin) {
    if (this.pluginMap[plugin]) {
      this.log.info('Unloading plugin: ' + plugin)
      this.pluginMap[plugin].status = 'unloading'
      this.pluginMap[plugin].plugin.onUnload()
      this.pluginMap[plugin].status = 'unloaded'
      this.pluginMap[plugin].plugin = null
      this.pluginMap[plugin].status = 'stopped'
    }
  }

  getLoadedPlugins () {
    const plugins = []
    for (const plugin of Object.keys(this.pluginMap)) {
      if (this.pluginMap[plugin].status === 'loaded') {
        plugins.push(plugin)
      }
    }
    return plugins
  }

  getLogger () {
    return this.log
  }

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

  unregisterActivity (plugin, from) {
    this._activitys[plugin].task = this._activitys[plugin].task.filter((activity) => {
      return activity.createdBy !== from
    })
  }

  _startActivityInterval () {
    this.activityInterval = setInterval(() => {
      for (const plugin of Object.keys(this._activitys)) {
        if (this._activitys[plugin].isActive) {
          for (const activity of this._activitys[plugin].task) {
            if (new Date().getTime() - activity.lastRun >= activity.ticks) {
              activity.cb()
              activity.lastRun = new Date().getTime()
            }
          }
        }
      }
    }, 1000)
  }

  setPluginActivity (plugin, status) {
    if (this.pluginMap[plugin] !== undefined) {
      this._activitys[plugin].isActive = status
    }
  }

  _stopActivityInterval () {
    clearInterval(this.activityInterval)
  }

  _stopUpdateProcess () {

  }

  _startUpdateProcess () {
    this.updater = setInterval(() => {

    }, this.updateInterval)
  }

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
