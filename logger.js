const log4js = require('log4js');
log4js.configure({
    appenders: {
        debug: {
            type: 'file',
            filename: 'logs/debug.log',
			maxLogSize: 20480
        }
    },
    categories: {
        default: {
            appenders: ['debug'],
            level: 'debug'
        }
    }
});

const logger = log4js.getLogger('debug');
module.exports = logger;
