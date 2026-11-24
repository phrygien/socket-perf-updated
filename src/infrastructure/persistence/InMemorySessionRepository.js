const SessionRepository = require("../../domain/ports/SessionRepository");
const SocketSession = require("../../domain/entities/SocketSession");

/**
 * Implémentation en mémoire du SessionRepository (remplace Redis en environnement mono-instance).
 */
class InMemorySessionRepository extends SessionRepository {
  constructor() {
    super();
    this.sessions = new Map();
  }

  async save(session) {
    const plain =
      typeof session.toJSON === "function" ? session.toJSON() : { ...session };
    this.sessions.set(plain.socketId, JSON.stringify(plain));
  }

  async findById(socketId) {
    const raw = this.sessions.get(socketId);
    return raw ? SocketSession.fromJSON(JSON.parse(raw)) : undefined;
  }

  async exists(socketId) {
    return this.sessions.has(socketId);
  }

  async delete(socketId) {
    this.sessions.delete(socketId);
  }

  async findAll() {
    const result = [];
    for (const raw of this.sessions.values()) {
      result.push(SocketSession.fromJSON(JSON.parse(raw)));
    }
    return result;
  }

  async findByRoom(room) {
    const all = await this.findAll();
    return all.filter((session) => session.room === room);
  }

  async findAdminByRoom(room) {
    const all = await this.findAll();
    return all.find((session) => session.isAdmin && session.room === room) || null;
  }

  async count() {
    return this.sessions.size;
  }

  async clear() {
    this.sessions.clear();
  }

  async close() {
    this.sessions.clear();
  }
}

module.exports = InMemorySessionRepository;
