class UpdateUsername {
  constructor({
    sessionRepository,
    roomPresenceService,
    realtimeGateway,
    historyLogger,
    logger,
  }) {
    this.sessionRepository = sessionRepository;
    this.roomPresenceService = roomPresenceService;
    this.realtimeGateway = realtimeGateway;
    this.historyLogger = historyLogger;
    this.logger = logger;
  }

  async execute({ socketId, pseudo }) {
    if (typeof pseudo !== "string" || !pseudo.trim()) return { updated: false };

    const session = await this.sessionRepository.findById(socketId);
    const trimmed = pseudo.trim();

    if (session) {
      session.updatePseudo(trimmed);
      await this.sessionRepository.save(session);
    }

    this.logger.info(`  [username] socket=${socketId} pseudo="${trimmed}"`);
    this.historyLogger.updatePseudo(socketId, trimmed);

    const room = session?.room;
    if (room) {
      const adminId = await this.roomPresenceService.getAdminOfRoom(room);
      this.realtimeGateway.emitToSocket(socketId, "userList", { admin: adminId });
      this.logger.info(`  [userList→${socketId}] admin=${adminId || "none"}`);
    }

    return { updated: true, pseudo: trimmed };
  }
}

module.exports = UpdateUsername;
