const SocketSession = require("../../../domain/entities/SocketSession");
const { RateLimitError } = require("../../../domain/errors/DomainError");

class ConnectSession {
  constructor({ sessionRepository, rateLimiter, logger }) {
    this.sessionRepository = sessionRepository;
    this.rateLimiter = rateLimiter;
    this.logger = logger;
  }

  async execute({ socketId, ip }) {
    const { allowed, count } = this.rateLimiter.acquire(ip);
    if (!allowed) {
      this.logger.info(`[RATE LIMIT] IP bloquée : ${ip} (${count} connexions)`);
      throw new RateLimitError("Too many connections");
    }

    try {
      const session = SocketSession.createDefault(socketId);
      await this.sessionRepository.save(session);
      return session;
    } catch (err) {
      this.rateLimiter.release(ip);
      this.logger.error(
        `[STORE] Erreur création entrée ${socketId} : ${err.message}`
      );
      throw err;
    }
  }

  async cleanupHandshakeAbort({ socketId, ip, wasConnected }) {
    this.rateLimiter.release(ip);
    if (!wasConnected) {
      await this.sessionRepository.delete(socketId).catch(() => {});
    }
  }
}

module.exports = ConnectSession;
