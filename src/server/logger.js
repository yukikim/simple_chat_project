const Log4js = require('log4js')
// import config from 'config';
const config = require('../../config/default')
Log4js.configure(config.log);

module.exports = class Log {
  constructor() {
    this.logger = Log4js.getLogger();
  }
   info(log) {
    this.logger.info(log);
  }
   error(log) {
    this.logger.error(log);
  }
}

// export const logger = new Log();