function registerAdminSocketHandler(socket, { authenticateAdmin }) {
  socket.on("admin", async (pseudo, key, ack) => {
    const done = (ok) => {
      if (typeof ack === "function") ack({ ok });
    };

    const result = await authenticateAdmin.execute({
      socketId: socket.id,
      pseudo,
      key,
      currentFails: socket.data.adminFails || 0,
    });

    socket.data.adminFails = result.fails;
    done(result.ok);
  });
}

module.exports = registerAdminSocketHandler;
