class HandleScreenEvents {
  constructor({
    sessionRepository,
    lotStateRepository,
    realtimeGateway,
    logger,
  }) {
    this.sessionRepository = sessionRepository;
    this.lotStateRepository = lotStateRepository;
    this.realtimeGateway = realtimeGateway;
    this.logger = logger;
  }

  async requestScreen({ socketId, data }) {
    const session = await this.sessionRepository.findById(socketId);
    const room = session?.room;
    if (!room) return;

    this.logger.info(`  [getScreen]: ${socketId} "${session?.pseudo}" → ${room}`);

    const cached = await this.lotStateRepository.findByRoom(room);
    if (cached) {
      this.logger.info(
        `  [getScreen]: réponse immédiate depuis le cache → ${socketId}`
      );
      this.realtimeGateway.emitToSocket(socketId, "sendMsg", {
        type: "numLot",
        msg: cached,
        name: "System",
        from: null,
      });
    }

    this.realtimeGateway.emitToRoom(room, "sendMsg", {
      type: "getScreen",
      msg: data || {},
      name: session?.pseudo || "unknown",
      from: socketId,
    });
  }

  async broadcastNumLot({ socketId, data }) {
    const session = await this.sessionRepository.findById(socketId);
    const room = session?.room;
    if (!room) return;

    this.logger.info(
      `  [numLot]   : ${socketId} lot=${data?.numLot} → ${room}`
    );

    if (data) {
      await this.lotStateRepository.save(room, data);
    }

    this.realtimeGateway.emitToRoom(room, "sendMsg", {
      type: "numLot",
      msg: data || {},
      name: session?.pseudo || "unknown",
      from: socketId,
    });
  }

  async broadcastPreviousLot({ socketId, data }) {
    const session = await this.sessionRepository.findById(socketId);
    const room = session?.room;
    if (!room) return;

    this.logger.info(
      `  [prevLot]  : ${socketId} lot=${data?.numLot} → ${room}`
    );

    this.realtimeGateway.emitToRoom(room, "sendMsg", {
      type: "previousLot",
      msg: data || {},
      name: session?.pseudo || "unknown",
      from: socketId,
    });
  }
}

module.exports = HandleScreenEvents;
