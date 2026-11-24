function registerDisconnectSocketHandler(socket, { disconnectSession }) {
  socket.on("disconnect", async (reason) => {
    await disconnectSession.execute({ socketId: socket.id, reason });
  });
}

module.exports = registerDisconnectSocketHandler;
