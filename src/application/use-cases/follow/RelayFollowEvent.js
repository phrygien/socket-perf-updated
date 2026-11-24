class RelayFollowEvent {
  constructor({ sessionRepository, realtimeGateway, logger }) {
    this.sessionRepository = sessionRepository;
    this.realtimeGateway = realtimeGateway;
    this.logger = logger;
  }

  async execute({ socketId, eventType, data }) {
    const session = await this.sessionRepository.findById(socketId);
    const room = session?.room;
    if (!room) return;

    if (eventType === "follow") {
      this.logger.info(
        `  [follow]   : ${socketId} "${session?.pseudo}" → ${room}`
      );
    } else if (eventType === "getUsers") {
      this.logger.info(`  [getUsers] : ${socketId} → ${room}`);
    }

    this.realtimeGateway.emitToRoom(room, "sendMsg", {
      type: eventType,
      msg: data || {},
      name: session?.pseudo || "unknown",
      from: socketId,
    });
  }
}

module.exports = RelayFollowEvent;
