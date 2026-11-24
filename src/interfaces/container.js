const http = require("http");

const { loadConfig } = require("../infrastructure/config/env");
const ConsoleLogger = require("../infrastructure/logging/ConsoleLogger");
const timingSafeEqual = require("../infrastructure/security/timingSafeEqual");
const InMemoryRateLimiter = require("../infrastructure/security/InMemoryRateLimiter");
const InMemorySessionRepository = require("../infrastructure/persistence/InMemorySessionRepository");
const InMemoryLotStateRepository = require("../infrastructure/persistence/InMemoryLotStateRepository");
const BufferedFileHistoryLogger = require("../infrastructure/persistence/BufferedFileHistoryLogger");
const SocketIoGateway = require("../infrastructure/realtime/SocketIoGateway");

const RoomPresenceService = require("../application/services/RoomPresenceService");
const SaleEndTimerService = require("../application/services/SaleEndTimerService");
const ConnectSession = require("../application/use-cases/session/ConnectSession");
const DisconnectSession = require("../application/use-cases/session/DisconnectSession");
const { AuthenticateAdmin } = require("../application/use-cases/admin/AuthenticateAdmin");
const JoinRoom = require("../application/use-cases/room/JoinRoom");
const UpdateUsername = require("../application/use-cases/room/UpdateUsername");
const BroadcastRoomMessage = require("../application/use-cases/room/BroadcastRoomMessage");
const GetRoomStats = require("../application/use-cases/room/GetRoomStats");
const RegisterBidderPresence = require("../application/use-cases/bidding/RegisterBidderPresence");
const ForwardBidderEvent = require("../application/use-cases/bidding/ForwardBidderEvent");
const RoutePrivateMessage = require("../application/use-cases/bidding/RoutePrivateMessage");
const HandleScreenEvents = require("../application/use-cases/screen/HandleScreenEvents");
const RelayFollowEvent = require("../application/use-cases/follow/RelayFollowEvent");

const createRequireDebugKey = require("./http/middlewares/requireDebugKey");
const createApp = require("./http/createApp");
const createSocketServer = require("./socket/createSocketServer");
const registerSocketHandlers = require("./socket/registerSocketHandlers");

/**
 * Composition Root (Clean Architecture) :
 * Assemble les adaptateurs d'infrastructure, les services applicatifs,
 * les cas d'usage et les interfaces HTTP / Socket.IO.
 */
function createAppContainer(overrides = {}) {
  const config = loadConfig(overrides.env || process.env);
  if (overrides.adminKey !== undefined) config.ADMIN_KEY = overrides.adminKey;
  if (overrides.debugKey !== undefined) config.DEBUG_KEY = overrides.debugKey;
  if (overrides.port !== undefined) config.PORT = overrides.port;

  const logger = overrides.logger || new ConsoleLogger();
  const sessionRepository =
    overrides.sessionRepository || new InMemorySessionRepository();
  const lotStateRepository =
    overrides.lotStateRepository || new InMemoryLotStateRepository();
  const historyLogger =
    overrides.historyLogger ||
    new BufferedFileHistoryLogger({
      logger,
      flushIntervalMs: overrides.historyFlushIntervalMs ?? 5000,
    });
  const rateLimiter =
    overrides.rateLimiter ||
    new InMemoryRateLimiter({
      maxConnections: overrides.maxConnections ?? 5,
      cleanupIntervalMs: overrides.rateLimitCleanupMs ?? 60_000,
      logger,
    });

  const getRoomStats = new GetRoomStats({ sessionRepository });
  const requireDebugKey = createRequireDebugKey({
    debugKey: config.DEBUG_KEY,
    safeEqual: timingSafeEqual,
  });

  const app = createApp({
    instanceId: config.INSTANCE_ID,
    sessionRepository,
    rateLimiter,
    getRoomStats,
    requireDebugKey,
  });

  const httpServer = http.createServer(app);

  const connectSession = new ConnectSession({
    sessionRepository,
    rateLimiter,
    logger,
  });

  const io = createSocketServer({
    httpServer,
    originPolicy: config.originPolicy,
    enforceOriginPolicy: overrides.enforceOriginPolicy ?? true,
    connectSession,
    logger,
  });

  const realtimeGateway = new SocketIoGateway(io);

  const roomPresenceService = new RoomPresenceService({
    sessionRepository,
    realtimeGateway,
    logger,
  });

  const saleEndTimerService = new SaleEndTimerService({
    realtimeGateway,
    logger,
  });

  const useCases = {
    connectSession,
    disconnectSession: new DisconnectSession({
      sessionRepository,
      roomPresenceService,
      realtimeGateway,
      logger,
    }),
    authenticateAdmin: new AuthenticateAdmin({
      sessionRepository,
      roomPresenceService,
      realtimeGateway,
      safeEqual: timingSafeEqual,
      adminKey: config.ADMIN_KEY,
      logger,
    }),
    joinRoom: new JoinRoom({
      sessionRepository,
      roomPresenceService,
      realtimeGateway,
      historyLogger,
      logger,
    }),
    updateUsername: new UpdateUsername({
      sessionRepository,
      roomPresenceService,
      realtimeGateway,
      historyLogger,
      logger,
    }),
    broadcastRoomMessage: new BroadcastRoomMessage({
      sessionRepository,
      lotStateRepository,
      realtimeGateway,
      logger,
    }),
    getRoomStats,
    registerBidderPresence: new RegisterBidderPresence({
      sessionRepository,
      realtimeGateway,
      logger,
    }),
    forwardBidderEvent: new ForwardBidderEvent({
      sessionRepository,
      realtimeGateway,
      logger,
    }),
    routePrivateMessage: new RoutePrivateMessage({
      sessionRepository,
      lotStateRepository,
      saleEndTimerService,
      realtimeGateway,
      logger,
    }),
    handleScreenEvents: new HandleScreenEvents({
      sessionRepository,
      lotStateRepository,
      realtimeGateway,
      logger,
    }),
    relayFollowEvent: new RelayFollowEvent({
      sessionRepository,
      realtimeGateway,
      logger,
    }),
  };

  registerSocketHandlers(io, useCases, logger);

  async function start() {
    return new Promise((resolve) => {
      httpServer.listen(config.PORT, "0.0.0.0", () => {
        const address = httpServer.address();
        const actualPort =
          typeof address === "object" && address ? address.port : config.PORT;

        logger.info(`Socket.IO server démarré sur http://0.0.0.0:${actualPort}`);
        logger.info(`Mode : PRODUCTION (instance=${config.INSTANCE_ID})`);
        logger.info(`Origines autorisées : ${config.ALLOWED_ORIGINS.join(", ")}`);
        if (!config.ADMIN_KEY) {
          logger.info(
            "[ADMIN] ATTENTION : ADMIN_KEY non défini — aucun admin ne pourra se connecter"
          );
        }
        logger.info(`Health : http://0.0.0.0:${actualPort}/`);
        resolve({ port: actualPort });
      });
    });
  }

  async function stop() {
    saleEndTimerService.clearAll();
    rateLimiter.stop();
    historyLogger.flushSync();
    await new Promise((resolve) => {
      io.close(() => {
        if (httpServer.listening) {
          httpServer.close(() => resolve());
        } else {
          resolve();
        }
      });
    });
    await sessionRepository.close();
    await lotStateRepository.clear();
  }

  return {
    config,
    logger,
    app,
    httpServer,
    io,
    sessionRepository,
    lotStateRepository,
    historyLogger,
    rateLimiter,
    saleEndTimerService,
    useCases,
    start,
    stop,
  };
}

module.exports = { createAppContainer };
