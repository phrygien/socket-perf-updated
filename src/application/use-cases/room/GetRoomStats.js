class GetRoomStats {
  constructor({ sessionRepository }) {
    this.sessionRepository = sessionRepository;
  }

  async getStats() {
    const sessions = await this.sessionRepository.findAll();
    const stats = {};
    for (const session of sessions) {
      const r = session.room || "none";
      if (!stats[r]) stats[r] = { count: 0, admins: [] };
      stats[r].count++;
      if (session.isAdmin) stats[r].admins.push(session.pseudo);
    }
    return stats;
  }

  async getFollowersInRoom(room) {
    const sessions = await this.sessionRepository.findByRoom(room);
    return sessions
      .filter((s) => !s.isAdmin)
      .map((s) => ({
        id: s.socketId,
        pseudo: s.pseudo,
        isAdmin: s.isAdmin,
        isFollower: s.isFollower(),
      }));
  }

  async getScreensInRoom(room) {
    const sessions = await this.sessionRepository.findByRoom(room);
    return sessions
      .filter((s) => !s.isAdmin)
      .map((s) => ({
        id: s.socketId,
        pseudo: s.pseudo,
        isScreen: s.isScreen(),
      }));
  }
}

module.exports = GetRoomStats;
