const Log4js = require('log4js')
import config from 'config';
Log4js.configure(config.get('log'));

class Log {
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

export const logger = new Log();