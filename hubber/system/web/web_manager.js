'use strict'

const https = require('https')
const express = require('express')

class WebManager {
  constructor (config, logger) {
    this.netConfig = config.get('network')
    this.authConfig = config.get('auth')
    this.log = logger
  }

  init () {
    this.app = express()
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
      cert: this.netConfig.tls.cert_file,
      key: this.netConfig.tls.key_file
    }

    if (this.authConfig.methods.client_cert.enabled) {
      opts.ca = [this.authConfig.methods.client_cert.trusted_ca_file]
    }

    https
      .createServer(opts, this.app)
      .listen(portBind, ipBind, () => {
        console.log(`Server listening on port ${portBind}`)
      })
  }

  _registerDefaultWebRouter () {

  }

  _fallback () {
    this.app.use(function (err, req, res, next) {
      console.error(err.stack)
      res.status(500).send('Something broke!')
    })
  }
}

module.exports = WebManager
