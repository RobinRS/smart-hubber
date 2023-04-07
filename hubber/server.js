/**
 * @fileoverview Hubber server entry point
 * @author Robin Schleser <robinschleser@web.de>
 * @version 0.0.2
 * @license MIT
 * @module server
 * @requires module:system/plugin/plugin_manager
 * @requires module:system/utils/config_manager
 * @requires module:system/web/web_router
 * @requires module:system/utils/ascii_art
 * @requires module:system/utils/logger
 * @requires module:dotenv
 */
require('dotenv').config()
const PluginManager = require('./system/plugin/plugin_manager')
const ConfigManager = require('./system/utils/config_manager')
const WebManager = require('./system/web/web_manager')

const cm = new ConfigManager('hubber/config/config.yml')
const ascii = require('./system/utils/ascii_art')
const logger = require('./system/utils/logger')(cm)

const pm = new PluginManager(cm, logger)
const web = new WebManager(cm, logger)

ascii.init()
pm.init()
web.init()
