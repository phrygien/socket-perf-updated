const { MessagePolicy } = require("../../../domain/policies/MessagePolicy");

class RoutePrivateMessage {
  constructor({
    sessionRepository,
    lotStateRepository,
    saleEndTimerService,
    realtimeGateway,
    logger,
  }) {
    this.sessionRepository = sessionRepository;
    this.lotStateRepository = lotStateRepository;
    this.saleEndTimerService = saleEndTimerService;
    this.realtimeGateway = realtimeGateway;
    this.logger = logger;
  }

  async execute({ socketId, data }) {
    if (!data) return;

    const { toid, type, msg, name } = data;
    const session = await this.sessionRepository.findById(socketId);
    const room = session?.room;

    this.logger.info(
      `  [getMsgPrv]: from=${socketId} to=${toid || "room"} type=${type}`
    );

    // Réponse immédiate depuis le cache si screen.php demande l'état courant
    if (type === "getScreen" && room) {
      const cached = await this.lotStateRepository.findByRoom(room);
      if (cached) {
        this.logger.info(
          `  [getMsgPrivate→cache hit] getScreen ${socketId} → réponse immédiate (room=${room})`
        );
        this.realtimeGateway.emitToSocket(socketId, "sendMsg", {
          type: "numLot",
          msg: cached,
          name: "System",
          from: null,
        });
      }
    }

    // Mise à jour du timer de fin de vente (numLot / listLot)
    if (type === "numLot" && msg?.time > 0 && room) {
      this.logger.info(
        `  [saleEnd]  : numLot lot=${msg.numLot} time=${msg.time}s room=${room}`
      );
      this.saleEndTimerService.updateTimer(room, msg.time);
    }

    if (type === "listLot" && Array.isArray(msg?.list) && room) {
      const maxTime = msg.list.reduce(
        (max, lot) => (lot?.time > max ? lot.time : max),
        0
      );
      if (maxTime > 0) {
        this.logger.info(
          `  [saleEnd]  : listLot maxTime=${maxTime}s room=${room}`
        );
        this.saleEndTimerService.updateTimer(room, maxTime);
      }
    }

    // Compatibilité ascendante confirmEnchere : price manquant -> myEnchere
    const { normalizedMsg, mappedPrice } =
      MessagePolicy.normalizeConfirmEncherePayload(type, msg);
    if (mappedPrice) {
      this.logger.info(
        `  [confirmEnchere] price absent → copié depuis myEnchere=${normalizedMsg.price} lot=${normalizedMsg.lot}`
      );
    }

    const payload = {
      type,
      msg: normalizedMsg,
      name: name || session?.pseudo || "unknown",
      from: socketId,
    };

    if (toid) {
      this.realtimeGateway.emitToSocket(toid, "sendMsg", payload);
      return;
    }

    if (room) {
      this.realtimeGateway.emitToRoom(room, "sendMsg", payload);
    }
  }
}

module.exports = RoutePrivateMessage;
