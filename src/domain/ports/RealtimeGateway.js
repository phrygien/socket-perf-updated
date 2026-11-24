/**
 * Port d'abstraction de la couche temps réel (Socket.IO ou mock en test).
 */
class RealtimeGateway {
  emitToRoom(_room, _event, _payload) { throw new Error("Not implemented"); }
  emitToSocket(_socketId, _event, _payload) { throw new Error("Not implemented"); }
  joinRoom(_socketId, _room) { throw new Error("Not implemented"); }
  leaveRoom(_socketId, _room) { throw new Error("Not implemented"); }
  isSocketInRoom(_socketId, _room) { throw new Error("Not implemented"); }
  disconnectSocket(_socketId) { throw new Error("Not implemented"); }
}

module.exports = RealtimeGateway;
