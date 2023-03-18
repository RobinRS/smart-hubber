const PluginManager = require('./system/plugin/plugin_manager')
const ConfigManager = require('./system/utils/config_manager')

const ascii = require('./system/utils/ascii_art')

const cm = new ConfigManager('hubber/config/config.yml')
const logger = require('./system/utils/logger').init(cm.get('logs'))
const pm = new PluginManager(cm, logger)

ascii.init()
pm.init()
