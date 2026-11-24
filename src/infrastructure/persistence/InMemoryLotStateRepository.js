const LotStateRepository = require("../../domain/ports/LotStateRepository");

const DEFAULT_TTL_SECONDS = 6 * 60 * 60; // 6 heures

class InMemoryLotStateRepository extends LotStateRepository {
  constructor(defaultTtlSeconds = DEFAULT_TTL_SECONDS) {
    super();
    this.defaultTtlSeconds = defaultTtlSeconds;
    this.cache = new Map();
  }

  async save(room, state, ttlSeconds = this.defaultTtlSeconds) {
    if (!room || !state) return;
    const expiresAt =
      typeof ttlSeconds === "number" && ttlSeconds > 0
        ? Date.now() + ttlSeconds * 1000
        : null;

    this.cache.set(room, {
      raw: JSON.stringify(state),
      expiresAt,
    });
  }

  async findByRoom(room) {
    const entry = this.cache.get(room);
    if (!entry) return null;
    if (entry.expiresAt !== null && Date.now() > entry.expiresAt) {
      this.cache.delete(room);
      return null;
    }
    return JSON.parse(entry.raw);
  }

  async clear() {
    this.cache.clear();
  }
}

module.exports = InMemoryLotStateRepository;
