class RegisterBidderPresence {
  constructor({ sessionRepository, realtimeGateway, logger }) {
    this.sessionRepository = sessionRepository;
    this.realtimeGateway = realtimeGateway;
    this.logger = logger;
  }

  async execute({ socketId, eventType, data }) {
    const session = await this.sessionRepository.findById(socketId);

    if (session && data) {
      session.updateBidderProfile({
        name: data.name,
        email: data.email,
        room: data.room,
      });
      if (data.room) {
        this.realtimeGateway.joinRoom(socketId, data.room);
      }
      await this.sessionRepository.save(session);
    }

    const room = session?.room;
    if (!room) return;

    const tag = eventType === "reconnection" ? "reconnect" : "connected";
    this.logger.info(
      `  [${tag}]: ${socketId} "${data?.name}" (${data?.email}) → ${room}`
    );

    this.realtimeGateway.emitToRoom(room, "sendMsg", {
      type: eventType,
      msg: data || {},
      name: session?.pseudo || "unknown",
      from: socketId,
    });
  }
}

module.exports = RegisterBidderPresence;
