const RateLimiter = require("../../domain/ports/RateLimiter");

class InMemoryRateLimiter extends RateLimiter {
  constructor({ maxConnections = 5, cleanupIntervalMs = 60_000, logger } = {}) {
    super();
    this.maxConnections = maxConnections;
    this.connPerIP = new Map();
    this.logger = logger;

    if (cleanupIntervalMs > 0) {
      this.cleanupTimer = setInterval(() => {
        const cleaned = this.cleanup();
        if (cleaned > 0 && this.logger) {
          this.logger.info(`[RATE LIMIT] Nettoyage : ${cleaned} entrées supprimées`);
        }
      }, cleanupIntervalMs);
      if (this.cleanupTimer.unref) this.cleanupTimer.unref();
    }
  }

  acquire(ip) {
    const count = this.connPerIP.get(ip) || 0;
    if (count >= this.maxConnections) {
      return { allowed: false, count };
    }
    this.connPerIP.set(ip, count + 1);
    return { allowed: true, count: count + 1 };
  }

  release(ip) {
    const next = (this.connPerIP.get(ip) || 1) - 1;
    if (next <= 0) {
      this.connPerIP.delete(ip);
    } else {
      this.connPerIP.set(ip, next);
    }
  }

  activeIpCount() {
    return this.connPerIP.size;
  }

  cleanup() {
    let cleaned = 0;
    for (const [ip, count] of this.connPerIP.entries()) {
      if (count <= 0) {
        this.connPerIP.delete(ip);
        cleaned++;
      }
    }
    return cleaned;
  }

  stop() {
    if (this.cleanupTimer) {
      clearInterval(this.cleanupTimer);
      this.cleanupTimer = null;
    }
  }
}

module.exports = InMemoryRateLimiter;
