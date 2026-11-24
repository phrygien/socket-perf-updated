const fs = require("fs");
const path = require("path");
const HistoryLogger = require("../../domain/ports/HistoryLogger");

class BufferedFileHistoryLogger extends HistoryLogger {
  constructor({
    filePath = path.resolve(process.cwd(), "historique.json"),
    flushIntervalMs = 5000,
    logger,
  } = {}) {
    super();
    this.filePath = filePath;
    this.flushIntervalMs = flushIntervalMs;
    this.logger = logger;
    this.buffer = [];
    this.flushTimer = null;
  }

  append(entry) {
    this.buffer.push(entry);
    this.scheduleFlush();
  }

  scheduleFlush() {
    if (this.flushTimer) return;
    this.flushTimer = setTimeout(() => this.flush(), this.flushIntervalMs);
    if (this.flushTimer.unref) this.flushTimer.unref();
  }

  flush() {
    this.flushTimer = null;
    if (this.buffer.length === 0) return;

    const toWrite = this.buffer.splice(0);
    const lines = toWrite.map((e) => JSON.stringify(e)).join("\n") + "\n";

    fs.appendFile(this.filePath, lines, "utf8", (err) => {
      if (err && this.logger) {
        this.logger.error(`[historique] ERREUR flush : ${err.message}`);
      }
    });
  }

  flushSync() {
    if (this.flushTimer) {
      clearTimeout(this.flushTimer);
      this.flushTimer = null;
    }
    if (this.buffer.length === 0) return;

    const toWrite = this.buffer.splice(0);
    const lines = toWrite.map((e) => JSON.stringify(e)).join("\n") + "\n";

    try {
      fs.appendFileSync(this.filePath, lines, "utf8");
    } catch (err) {
      if (this.logger) {
        this.logger.error(`[historique] ERREUR flush sync : ${err.message}`);
      }
    }
  }

  updatePseudo(socketId, pseudo) {
    for (let i = this.buffer.length - 1; i >= 0; i--) {
      if (
        this.buffer[i].socketId === socketId &&
        this.buffer[i].event === "joinroom"
      ) {
        this.buffer[i].pseudo = pseudo;
        break;
      }
    }
  }
}

module.exports = BufferedFileHistoryLogger;
