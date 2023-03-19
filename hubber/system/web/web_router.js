const fs = require('fs')
const https = require('https')
const express = require('express')
const certAuth = require('./auth/cert')

const app = express()

app.get('/', (req, res, next) => {
  const cert = req.socket.getPeerCertificate()
  if (req.client.authorized) {
    res.send(`Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`)
  } else if (cert.subject) {
    return res.status(403)
      .send(`Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`)
  } else {
    return res.status(401)
      .send('Sorry, but you need to provide a client certificate to continue.')
  }
  return next()
})

app.use(function (err, req, res, next) {
  console.error(err.stack)
  res.status(500).send('Something broke!')
})

module.exports = () => {
  https
    .createServer(
      {
        requestCert: true,
        rejectUnauthorized: false,
        cert: fs.readFileSync(process.env.CERT_PATH),
        key: fs.readFileSync(process.env.CERT_KEY),
        ca: [fs.readFileSync(process.env.CERT_PATH)]
      },
      app
    )
    .listen(process.env.PORT || 8443, () => {
      console.log(`Server listening on port ${process.env.PORT || 8443}`)
    })
}
