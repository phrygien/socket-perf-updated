const getClientIp = require("../utils/getClientIp");

function registerRoomSocketHandler(
  socket,
  { joinRoom, updateUsername, broadcastRoomMessage }
) {
  socket.on("joinroom", async (room) => {
    const clientIp = getClientIp(
      socket.handshake.headers,
      socket.handshake.address
    );
    await joinRoom.execute({ socketId: socket.id, room, clientIp });
  });

  socket.on("username", async (pseudo) => {
    await updateUsername.execute({ socketId: socket.id, pseudo });
  });

  socket.on("getMsgRoom", async (data) => {
    await broadcastRoomMessage.execute({ socketId: socket.id, data });
  });
}

module.exports = registerRoomSocketHandler;
