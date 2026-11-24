const RealtimeGateway = require("../../domain/ports/RealtimeGateway");

class SocketIoGateway extends RealtimeGateway {
  constructor(io) {
    super();
    this.io = io;
  }

  emitToRoom(room, event, payload) {
    this.io.to(room).emit(event, payload);
  }

  emitToSocket(socketId, event, payload) {
    this.io.to(socketId).emit(event, payload);
  }

  joinRoom(socketId, room) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) socket.join(room);
  }

  leaveRoom(socketId, room) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (socket) socket.leave(room);
  }

  isSocketInRoom(socketId, room) {
    const socket = this.io.sockets.sockets.get(socketId);
    return Boolean(socket && socket.rooms.has(room));
  }

  disconnectSocket(socketId) {
    const socket = this.io.sockets.sockets.get(socketId);
    if (!socket) return false;
    socket.disconnect(true);
    return true;
  }
}

module.exports = SocketIoGateway;
