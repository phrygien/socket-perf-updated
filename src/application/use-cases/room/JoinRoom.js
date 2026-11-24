const { MessagePolicy } = require("../../../domain/policies/MessagePolicy");

class JoinRoom {
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

  async execute({ socketId, room, clientIp = "inconnue" }) {
    if (!MessagePolicy.isValidRoomName(room)) {
      this.logger.info(`  [joinroom] REFUSÉ room invalide – socket=${socketId}`);
      return { joined: false };
    }

    const session = await this.sessionRepository.findById(socketId);

    if (session?.room) {
      this.realtimeGateway.leaveRoom(socketId, session.room);
      if (session.isAdmin) {
        await this.roomPresenceService.broadcastUserList(session.room);
      }
    }

    if (session?.isAdmin) {
      await this.roomPresenceService.evictStaleAdmin(room, socketId);
    }

    this.realtimeGateway.joinRoom(socketId, room);

    if (session) {
      session.joinRoom(room);
      await this.sessionRepository.save(session);
    }

    this.logger.info(
      `  [joinroom] socket=${socketId} → room="${room}" ip=${clientIp} admin=${session?.isAdmin}`
    );

    this.historyLogger.append({
      event: "joinroom",
      socketId,
      ip: clientIp,
      room,
      pseudo: session?.pseudo || "inconnu",
      isAdmin: session?.isAdmin ?? false,
      timestamp: new Date().toISOString(),
    });

    if (session?.isAdmin) {
      await this.roomPresenceService.broadcastUserList(room);
    } else {
      const adminId = await this.roomPresenceService.getAdminOfRoom(room);
      this.realtimeGateway.emitToSocket(socketId, "userList", { admin: adminId });
      this.logger.info(`  [userList→${socketId}] admin=${adminId || "none"}`);
    }

    return { joined: true, room };
  }
}

module.exports = JoinRoom;
