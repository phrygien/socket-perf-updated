/**
 * Port d'enregistrement d'historique des connexions/salles.
 */
class HistoryLogger {
  append(_entry) { throw new Error("Not implemented"); }
  updatePseudo(_socketId, _pseudo) { throw new Error("Not implemented"); }
  flushSync() { throw new Error("Not implemented"); }
}

module.exports = HistoryLogger;
