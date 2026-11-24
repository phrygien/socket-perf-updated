const { Server } = require("socket.io");
const getClientIp = require("./utils/getClientIp");

function createSocketServer({
  httpServer,
  originPolicy,
  enforceOriginPolicy = true,
  connectSession,
  logger,
}) {
  const ioOptions = {
    pingInterval: 10000,
    pingTimeout: 20000,
    connectTimeout: 10000,
    maxHttpBufferSize: 1e7,
    perMessageDeflate: { threshold: 8192 },
    allowEIO3: true,
    transports: ["polling", "websocket"],
    cors: enforceOriginPolicy
      ? {
          origin: originPolicy.getList(),
          methods: ["GET", "POST"],
          credentials: true,
        }
      : { origin: "*" },
  };

  if (enforceOriginPolicy) {
    ioOptions.allowRequest = (req, callback) => {
      const origin = req.headers.origin;
      if (originPolicy.isAllowed(origin)) {
        return callback(null, true);
      }

      const ip = getClientIp(req.headers, req.socket.remoteAddress);
      logger.info(`[ORIGIN BLOQUÉE] origin=${origin || "(aucune)"} ip=${ip}`);
      return callback("Origin not allowed", false);
    };
  }

  const io = new Server(httpServer, ioOptions);

  // MOCKED — in-memory Socket.IO adapter (no external Redis cluster required)
  logger.info("[REDIS ADAPTER] Mocké — utilisation de l'adapter Socket.IO en mémoire");

  io.use(async (socket, next) => {
    const ip = getClientIp(socket.handshake.headers, socket.handshake.address);

    try {
      await connectSession.execute({ socketId: socket.id, ip });
    } catch (err) {
      const msg =
        err.code === "RATE_LIMIT" ? "Too many connections" : "Server error";
      return next(new Error(msg));
    }

    socket.on("disconnect", () => {
      connectSession.cleanupHandshakeAbort({
        socketId: socket.id,
        ip,
        wasConnected: Boolean(socket.data.connected),
      });
    });

    next();
  });

  return io;
}

module.exports = createSocketServer;
