/**
 * @fileoverview Hubber server entry point
 * @author Robin Schleser <robinschleser@web.de>
 * @version 0.0.2
 * @license MIT
 * @module server
 * @requires module:system/plugin/plugin_manager
 * @requires module:system/utils/config_manager
 * @requires module:system/utils/ascii_art
 * @requires module:system/utils/logger
 */
const PluginManager = require('./system/plugin/plugin_manager')
const ConfigManager = require('./system/utils/config_manager')

const ascii = require('./system/utils/ascii_art')

const cm = new ConfigManager('hubber/config/config.yml')
const logger = require('./system/utils/logger').init(cm.get('logs'))
const pm = new PluginManager(cm, logger)

ascii.init()
pm.init()
