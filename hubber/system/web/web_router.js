const fs = require('fs')
const https = require('https')
const express = require('express')
const certAuth = require('./auth/cert')

const app = express()

app.get('/', certAuth, (req, res) => {
  if (!req.client.authorized) {
    return res.status(401).send('Invalid client certificate authentication.')
  }

  return res.send('Hello, world!')
})

module.exports = () => {
  https
    .createServer(
      {
        requestCert: true,
        rejectUnauthorized: false,
        cert: fs.readFileSync(process.env.CERT_PATH),
        key: fs.readFileSync(process.env.CERT_KEY)
      },
      app
    )
    .listen(8443, () => {
      console.log('Server listening on port 8443')
    })
}
