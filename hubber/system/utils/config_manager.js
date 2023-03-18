'use strict'

const yaml = require('js-yaml')
const fs = require('fs')
const path = require('path')

class ConfigManager {
  constructor (configFile) {
    this.configFile = path.resolve(configFile)
    this.config = {}
    this.configFiles = {}
    this.init()
  }

  init () {
    this.config = yaml.load(fs.readFileSync(this.configFile, 'utf8'))
    this.configDir = path.resolve(this.config.config.dir)
    for (const key in this.config) {
      if (this.config[key].file !== undefined) {
        this.config[key] = Object.assign(this.config[key], yaml.load(fs.readFileSync(this.configDir + '/' + this.config[key].file)))
        this.configFiles[key] = this.configDir + this.config[key].file
      }
    }
  }

  getConfigurations () {
    return this.configFiles
  }

  get (key) {
    return this.config[key]
  }

  set (key, value) {
    this.config[key] = value
  }

  load (file) {
    return yaml.load(fs.readFileSync(file, 'utf8'))
  }
}

module.exports = ConfigManager
