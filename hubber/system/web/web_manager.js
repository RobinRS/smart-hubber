'use strict'

const https = require('https')
const express = require('express')
const ejs = require('ejs')
const path = require('path')

class WebManager {
  constructor (config, pluginManager, logger) {
    this.netConfig = config.get('network')
    this.authConfig = config.get('auth')
    this.config = config
    this.log = logger
    this.pluginManager = pluginManager
  }

  init () {
    this.app = express()
    this.app.set('views', path.join(__dirname, '../../../hubber/assets/dashboard'))
    this.app.set('view engine', 'ejs')
    this._registerDefaultWebRouter()
    this._fallback()
    this.start()
  }

  registerWebRouter (path, router) {
    this.app.use(path, router)
  }

  start () {
    const ipBind = this.netConfig.bind.ipv4
    const portBind = this.netConfig.bind.port

    const opts = {
      requestCert: true,
      rejectUnauthorized: false,
      cert: this.netConfig.cert_file,
      key: this.netConfig.key_file
    }

    if (this.authConfig.methods.client_cert.enabled) {
      this.config.requestReadSubFileToRuntime(this.authConfig.methods, 'client_cert')
      opts.ca = [this.authConfig.methods.client_cert.trusted_ca_file]
    }

    https
      .createServer(opts, this.app)
      .listen(portBind, ipBind, () => {
        this.log.info(`Webserver listening on  ${ipBind}:${portBind}`)
      })
  }

  _registerDefaultWebRouter () {
    let homeRouter = require('./routes/home')
    homeRouter = homeRouter(this.pluginManager, this.config)
    this.registerWebRouter('/', homeRouter)
  }

  _fallback () {
    this.app.get('*', function (req, res) {
      this.log.error(req.url + ' not found')
      res.status(404).send('Not found')
    }.bind(this))
    this.app.use(function (err, req, res, next) {
      this.log.error(req.url + ' ' + err.stack)
      res.redirect('/')
    }.bind(this))
  }
}

module.exports = WebManager
