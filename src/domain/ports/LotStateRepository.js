/**
 * Port de cache de l'état courant des lots par salle (utilisé par screen.php).
 * Séparé de SessionRepository pour respecter le principe de responsabilité unique.
 */
class LotStateRepository {
  async save(_room, _state, _ttlSeconds) { throw new Error("Not implemented"); }
  async findByRoom(_room) { throw new Error("Not implemented"); }
  async clear() { throw new Error("Not implemented"); }
}

module.exports = LotStateRepository;
