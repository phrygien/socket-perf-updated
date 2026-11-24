function registerFollowSocketHandler(socket, { relayFollowEvent }) {
  socket.on("follow", async (data) => {
    await relayFollowEvent.execute({
      socketId: socket.id,
      eventType: "follow",
      data,
    });
  });

  socket.on("getUsers", async (data) => {
    await relayFollowEvent.execute({
      socketId: socket.id,
      eventType: "getUsers",
      data,
    });
  });
}

module.exports = registerFollowSocketHandler;
