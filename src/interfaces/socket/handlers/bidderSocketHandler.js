function registerBidderSocketHandler(
  socket,
  { registerBidderPresence, forwardBidderEvent, routePrivateMessage }
) {
  socket.on("connected", async (data) => {
    await registerBidderPresence.execute({
      socketId: socket.id,
      eventType: "connected",
      data,
    });
  });

  socket.on("reconnection", async (data) => {
    await registerBidderPresence.execute({
      socketId: socket.id,
      eventType: "reconnection",
      data,
    });
  });

  socket.on("getEncheresList", async (data) => {
    await forwardBidderEvent.execute({
      socketId: socket.id,
      eventType: "getEncheresList",
      data,
    });
  });

  socket.on("getEncheres", async (data) => {
    await forwardBidderEvent.execute({
      socketId: socket.id,
      eventType: "getEncheres",
      data,
    });
  });

  socket.on("doEncheres", async (data) => {
    await forwardBidderEvent.execute({
      socketId: socket.id,
      eventType: "doEncheres",
      data,
    });
  });

  socket.on("getMsgPrivate", async (data) => {
    await routePrivateMessage.execute({ socketId: socket.id, data });
  });
}

module.exports = registerBidderSocketHandler;
