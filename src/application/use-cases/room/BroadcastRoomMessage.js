const { MessagePolicy } = require("../../../domain/policies/MessagePolicy");

class BroadcastRoomMessage {
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

  async execute({ socketId, data }) {
    if (!data || !MessagePolicy.isValidRoomName(data.room)) {
      this.logger.info(
        `  [getMsgRoom] REFUSÉ champ room absent/invalide – socket=${socketId}`
      );
      return { sent: false };
    }

    if (!MessagePolicy.isValidMessageType(data.type)) {
      this.logger.info(
        `  [getMsgRoom] REFUSÉ champ type absent/invalide – socket=${socketId}`
      );
      return { sent: false };
    }

    if (!this.realtimeGateway.isSocketInRoom(socketId, data.room)) {
      this.logger.info(
        `  [getMsgRoom] REFUSÉ – ${socketId} n'appartient pas à "${data.room}"`
      );
      return { sent: false };
    }

    if (!MessagePolicy.isAllowedType(data.type)) {
      this.logger.info(
        `  [getMsgRoom] REFUSÉ – type non autorisé "${data.type}" depuis ${socketId}`
      );
      return { sent: false };
    }

    const session = await this.sessionRepository.findById(socketId);
    if (MessagePolicy.requiresAdmin(data.type) && !session?.isAdmin) {
      this.logger.info(
        `  [getMsgRoom] REFUSÉ – type admin "${data.type}" émis par non-admin ${socketId}`
      );
      return { sent: false };
    }

    if (data.type === "numLot") {
      this.logger.info(
        `  [getMsgRoom→cache] numLot lot=${data.msg?.numLot} room=${data.room}`
      );
      await this.lotStateRepository.save(data.room, data.msg || {});
    }

    const payload = {
      type: data.type,
      msg: data.msg || {},
      name: data.name || session?.pseudo || "unknown",
      from: socketId,
    };

    this.logger.info(
      `  [room→${data.room}] type="${data.type}" from=${socketId} (admin=${session?.isAdmin})`
    );

    this.realtimeGateway.emitToRoom(data.room, "sendMsg", payload);
    return { sent: true, payload };
  }
}

module.exports = BroadcastRoomMessage;
