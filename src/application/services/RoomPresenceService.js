/**
 * Service applicatif de gestion de la présence dans les salles et d'éviction d'admin fantôme.
 */
class RoomPresenceService {
  constructor({ sessionRepository, realtimeGateway, logger }) {
    this.sessionRepository = sessionRepository;
    this.realtimeGateway = realtimeGateway;
    this.logger = logger;
  }

  async getAdminOfRoom(room) {
    const admin = await this.sessionRepository.findAdminByRoom(room);
    return admin ? admin.socketId : null;
  }

  async broadcastUserList(room) {
    const adminId = await this.getAdminOfRoom(room);
    this.realtimeGateway.emitToRoom(room, "userList", { admin: adminId });
    this.logger.info(`  [userList] : room=${room} admin=${adminId || "none"}`);
  }

  async evictStaleAdmin(room, incomingSocketId, contextLabel = "") {
    const existingAdminId = await this.getAdminOfRoom(room);
    if (!existingAdminId || existingAdminId === incomingSocketId) return;

    const disconnected = this.realtimeGateway.disconnectSocket(existingAdminId);
    const prefix = contextLabel ? `(${contextLabel}) ` : "";

    if (disconnected) {
      this.logger.info(
        `  [ADMIN REPLACE] ${prefix}ancien admin=${existingAdminId} expulsé de room="${room}" (remplacé par ${incomingSocketId})`
      );
    } else {
      this.logger.info(
        `  [ADMIN REPLACE] ${prefix}ancien admin=${existingAdminId} déjà fantôme, nettoyage direct du store`
      );
      await this.sessionRepository.delete(existingAdminId);
    }
  }
}

module.exports = RoomPresenceService;
