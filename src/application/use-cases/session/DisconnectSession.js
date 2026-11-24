class DisconnectSession {
  constructor({
    sessionRepository,
    roomPresenceService,
    realtimeGateway,
    logger,
  }) {
    this.sessionRepository = sessionRepository;
    this.roomPresenceService = roomPresenceService;
    this.realtimeGateway = realtimeGateway;
    this.logger = logger;
  }

  async execute({ socketId, reason }) {
    const session = await this.sessionRepository.findById(socketId);

    this.logger.info(`- Déconnexion: ${socketId} (${reason})`);

    // Supprimer du store EN PREMIER pour que broadcastUserList ne retrouve plus cet admin
    await this.sessionRepository.delete(socketId);

    if (session?.room) {
      this.realtimeGateway.emitToRoom(session.room, "sendMsg", {
        type: "exit",
        msg: { room: session.room, email: session.email || "" },
        name: session.pseudo || "unknown",
        from: socketId,
      });

      if (session.isAdmin) {
        await this.roomPresenceService.broadcastUserList(session.room);
      }
    }
  }
}

module.exports = DisconnectSession;
