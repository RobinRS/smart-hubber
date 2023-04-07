'use strict'

const fs = require('fs')
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
  }

  registerWebRouter (path, router) {
    this.app.use(path, router)
  }

  start () {
    const ipBind = this.netConfig.bind.ipv4
    const portBind = this.netConfig.bind.port
    const trustedCA = []

    if (this.authConfig.methods.client_cert.enabled) {
      trustedCA.push(fs.readFileSync(this.authConfig.methods.client_cert.trusted_ca))
    }

    https
      .createServer(
        {
          requestCert: true,
          rejectUnauthorized: false,
          cert: this.netConfig.tls.cert,
          key: this.netConfig.tls.key,
          ca: [fs.readFileSync(process.env.CERT_CA)]
        },
        this.app
      )
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
