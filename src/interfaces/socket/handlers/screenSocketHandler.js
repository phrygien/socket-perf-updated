function registerScreenSocketHandler(socket, { handleScreenEvents }) {
  socket.on("getScreen", async (data) => {
    await handleScreenEvents.requestScreen({ socketId: socket.id, data });
  });

  socket.on("numLot", async (data) => {
    await handleScreenEvents.broadcastNumLot({ socketId: socket.id, data });
  });

  socket.on("previousLot", async (data) => {
    await handleScreenEvents.broadcastPreviousLot({
      socketId: socket.id,
      data,
    });
  });
}

module.exports = registerScreenSocketHandler;
