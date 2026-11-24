/**
 * Port de persistance des sessions socket.
 * Permet d'interchanger implémentation mémoire locale, Redis, etc.
 */
class SessionRepository {
  async save(_session) { throw new Error("Not implemented"); }
  async findById(_socketId) { throw new Error("Not implemented"); }
  async exists(_socketId) { throw new Error("Not implemented"); }
  async delete(_socketId) { throw new Error("Not implemented"); }
  async findAll() { throw new Error("Not implemented"); }
  async findByRoom(_room) { throw new Error("Not implemented"); }
  async findAdminByRoom(_room) { throw new Error("Not implemented"); }
  async count() { throw new Error("Not implemented"); }
  async clear() { throw new Error("Not implemented"); }
  async close() { throw new Error("Not implemented"); }
}

module.exports = SessionRepository;
