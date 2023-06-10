const router = require('express').Router()
const PluginRouter = require('./default')

function registerHomeRouter (pluginManager, config) {
  const pluginRouter = PluginRouter(pluginManager, config)
  router.use('/', pluginRouter)

  router.get('/', (req, res, next) => {
    const cert = req.socket.getPeerCertificate()
    const renderParameter = {
      base: {
        metadata: {
          web: {
            title: 'Home Hub | Schleser Family'
          }
        },
        parameter: {
          showHome: false,
          showLogin: false,
          showLogout: false,
          showPublic: false,
          hasBanner: true
        },
        banner: {
          message: 'Welcome to Hubber',
          type: 'info',
          title: 'Hello there....'
        },
        user: {
          name: cert?.subject?.CN,
          isDev: process.env._HUBBER_DEV,
          isAuth: req.client.authorized
        }
      }
    }

    if (req.client.authorized || (process.env._HUBBER_DEV && cert.subject)) {
      renderParameter.base.banner.message = `Hello ${cert.subject.CN}, your certificate was issued by ${cert.issuer.CN}!`
      renderParameter.base.banner.type = 'success'
      renderParameter.base.parameter.showHome = true
    } else if (cert.subject) {
      renderParameter.base.banner.message = `Sorry ${cert.subject.CN}, certificates from ${cert.issuer.CN} are not welcome here.`
      renderParameter.base.banner.type = 'danger'
      renderParameter.base.parameter.showPublic = true
    } else {
      renderParameter.base.banner.message = 'Hi public user'
      renderParameter.base.banner.type = 'info'
      renderParameter.base.parameter.showPublic = true
    }
    renderBase(renderParameter, req, res, next)
  })

  return router
}

function renderBase (params, req, res, next) {
  return res.render('./base', params)
}

module.exports = registerHomeRouter
