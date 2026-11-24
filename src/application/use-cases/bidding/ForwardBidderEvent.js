class ForwardBidderEvent {
  constructor({ sessionRepository, realtimeGateway, logger }) {
    this.sessionRepository = sessionRepository;
    this.realtimeGateway = realtimeGateway;
    this.logger = logger;
  }

  async execute({ socketId, eventType, data }) {
    const session = await this.sessionRepository.findById(socketId);
    const room = session?.room || data?.room;
    if (!room) return;

    if (eventType === "doEncheres") {
      this.logger.info(
        `  [enchère]  : ${socketId} lot=${data?.lot} montant=${data?.myEnchere}`
      );
    } else if (eventType === "getEncheresList") {
      this.logger.info(`  [getList]  : ${socketId} → ${room}`);
    } else if (eventType === "getEncheres") {
      this.logger.info(`  [getEnch]  : ${socketId} → ${room}`);
    }

    this.realtimeGateway.emitToRoom(room, "sendMsg", {
      type: eventType,
      msg: data || {},
      name: session?.pseudo || "unknown",
      from: socketId,
    });
  }
}

module.exports = ForwardBidderEvent;
