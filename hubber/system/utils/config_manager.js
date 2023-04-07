'use strict'

const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

/**
 * @file config_manager.js
 * @description Loads and manages the configuration files for the hubber system
 * @class ConfigManager
 * @example config.get('plugin').plugin_dir
 */
class ConfigManager {
  /**
   * @constructor
   * @param {string} configFile - Path to the main configuration file
   * @returns {ConfigManager} - ConfigManager instance
   * @example const config = new ConfigManager('config/config.yml')
   * @example config.get('plugin').plugin_dir
   */
  constructor (configFile) {
    if (!fs.existsSync(configFile)) {
      console.error('Config file not found: ' + configFile)
      process.exit()
    }

    this.configFile = path.resolve(configFile)
    this.config = {}
    this.configFiles = {}
    this.init()
  }

  /**
   * @description Loads the main configuration file and all the files defined in the main configuration file. Executed in the constructor.
   * @returns {void}
   */
  init () {
    this.config = this.load(this.configFile)
    this.configDir = path.resolve(this.config.config.dir)
    for (const key in this.config) {
      if (this.config[key].file !== undefined) {
        this.config[key] = Object.assign(this.config[key], this.load(this.configDir + '/' + this.config[key].file))
        this.configFiles[key] = this.configDir + this.config[key].file
        this.config = this._readSubFileToRuntime(this.config, key)
      }
    }
  }

  _readSubFileToRuntime (config, key) {
    for (const subConfigKey in config[key]) {
      if (subConfigKey.endsWith('_file')) {
        let path = config[key][subConfigKey]
        if (!path.startsWith('/')) {
          path = this.configDir + '/' + config[key][subConfigKey]
        }
        config[key][subConfigKey] = fs.readFileSync(path, 'utf8')
      }
    }
    return config
  }

  requestReadSubFileToRuntime (config, key) {
    return this._readSubFileToRuntime(config, key)
  }

  /**
   * @description Returns the path to the main configuration file
   * @returns {Array} - Path to the configuration files
   */
  getConfigurations () {
    return this.configFiles
  }

  /**
   * @param {string} key - Key of the configuration value
   * @returns {any} - Value of the configuration key
   */
  get (key) {
    return this.config[key]
  }

  /**
   * @description Sets a configuration value, only for the current session
   * @param {string} key - Key of the configuration value
   * @param {any} value - Value of the configuration key
   * @returns {void}
   */
  set (key, value) {
    this.config[key] = value
  }

  /**
   * @description Loads a configuration file for the current session
   * @example const cfg = config.load('config/config.yml')
   * @returns {Object} - JavaScript object from the configuration file
   */
  load (file) {
    return yaml.load(fs.readFileSync(file, 'utf8'))
  }
}

module.exports = ConfigManager
