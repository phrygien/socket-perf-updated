const Logger = require("../../domain/ports/Logger");

class ConsoleLogger extends Logger {
  info(msg, ...args) {
    const ts = new Date().toISOString().slice(11, 19);
    console.log(`[${ts}] ${msg}`, ...args);
  }

  error(msg, ...args) {
    const ts = new Date().toISOString().slice(11, 19);
    console.error(`[${ts}] ${msg}`, ...args);
  }
}

module.exports = ConsoleLogger;
