const MAX_ADMIN_FAILS = 3;

class AuthenticateAdmin {
  constructor({
    sessionRepository,
    roomPresenceService,
    realtimeGateway,
    safeEqual,
    adminKey,
    logger,
  }) {
    this.sessionRepository = sessionRepository;
    this.roomPresenceService = roomPresenceService;
    this.realtimeGateway = realtimeGateway;
    this.safeEqual = safeEqual;
    this.adminKey = adminKey;
    this.logger = logger;
  }

  async execute({ socketId, pseudo, key, currentFails = 0 }) {
    if (!this.adminKey) {
      this.logger.info(
        `  [admin]    : REFUSÉ – ADMIN_KEY non configurée (${socketId})`
      );
      return { ok: false, shouldDisconnect: false, fails: currentFails };
    }

    if (typeof key !== "string" || !this.safeEqual(key, this.adminKey)) {
      const fails = currentFails + 1;
      this.logger.info(
        `  [admin]    : REFUSÉ – clé invalide (${fails}/${MAX_ADMIN_FAILS}) socket=${socketId}`
      );
      const shouldDisconnect = fails >= MAX_ADMIN_FAILS;
      if (shouldDisconnect) {
        this.realtimeGateway.disconnectSocket(socketId);
      }
      return { ok: false, shouldDisconnect, fails };
    }

    const session = await this.sessionRepository.findById(socketId);
    let cleanPseudo = "Admin";

    if (session) {
      cleanPseudo = session.promoteToAdmin(pseudo);

      if (session.room) {
        await this.roomPresenceService.evictStaleAdmin(
          session.room,
          socketId,
          "via 'admin' event"
        );
      }

      await this.sessionRepository.save(session);
    }

    this.logger.info(`  [admin]    : ${socketId} → "${cleanPseudo}"`);

    if (session?.room) {
      await this.roomPresenceService.broadcastUserList(session.room);
    }

    return { ok: true, shouldDisconnect: false, fails: 0, pseudo: cleanPseudo };
  }
}

module.exports = { AuthenticateAdmin, MAX_ADMIN_FAILS };
