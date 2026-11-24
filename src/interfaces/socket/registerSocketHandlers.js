const registerAdminSocketHandler = require("./handlers/adminSocketHandler");
const registerRoomSocketHandler = require("./handlers/roomSocketHandler");
const registerBidderSocketHandler = require("./handlers/bidderSocketHandler");
const registerScreenSocketHandler = require("./handlers/screenSocketHandler");
const registerFollowSocketHandler = require("./handlers/followSocketHandler");
const registerDisconnectSocketHandler = require("./handlers/disconnectSocketHandler");

/**
 * Sérialise les événements reçus sur un même socket pour éviter toute race
 * condition lors de mutations concurrentes de session (ex: joinroom + username).
 */
function createQueuedSocket(socket, logger) {
  let chain = Promise.resolve();

  return {
    id: socket.id,
    data: socket.data,
    handshake: socket.handshake,
    on(event, handler) {
      socket.on(event, (...args) => {
        chain = chain
          .then(() => handler(...args))
          .catch((err) => {
            logger.error(
              `[SOCKET ERROR] socket=${socket.id} event=${event}: ${err?.message || err}`
            );
          });
      });
    },
  };
}

function registerSocketHandlers(io, useCases, logger) {
  io.on("connection", (socket) => {
    socket.data.connected = true;

    logger.info(`+ Connexion : ${socket.id}`);
    logger.info(`Transport : ${socket.conn.transport.name}`);

    socket.conn.on("upgrade", () => {
      logger.info(`[UPGRADE] ${socket.id} -> ${socket.conn.transport.name}`);
    });

    socket.on("connect_error", (err) => {
      logger.info(`Connect error ${socket.id}: ${err.message}`);
    });

    const queuedSocket = createQueuedSocket(socket, logger);

    registerAdminSocketHandler(queuedSocket, useCases);
    registerRoomSocketHandler(queuedSocket, useCases);
    registerBidderSocketHandler(queuedSocket, useCases);
    registerScreenSocketHandler(queuedSocket, useCases);
    registerFollowSocketHandler(queuedSocket, useCases);
    registerDisconnectSocketHandler(queuedSocket, useCases);
  });
}

module.exports = registerSocketHandlers;
