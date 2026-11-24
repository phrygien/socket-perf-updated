const SocketSession = require("../../src/domain/entities/SocketSession");
const { MessagePolicy } = require("../../src/domain/policies/MessagePolicy");
const { OriginPolicy } = require("../../src/domain/policies/OriginPolicy");
const InMemorySessionRepository = require("../../src/infrastructure/persistence/InMemorySessionRepository");
const InMemoryLotStateRepository = require("../../src/infrastructure/persistence/InMemoryLotStateRepository");
const timingSafeEqual = require("../../src/infrastructure/security/timingSafeEqual");
const { AuthenticateAdmin } = require("../../src/application/use-cases/admin/AuthenticateAdmin");
const BroadcastRoomMessage = require("../../src/application/use-cases/room/BroadcastRoomMessage");

const silentLogger = { info: () => {}, error: () => {} };

describe("Domain: OriginPolicy", () => {
  test("utilise les origines par défaut et ignore le joker *", () => {
    const policy = OriginPolicy.fromEnv({
      ALLOWED_ORIGINS: "https://a.com, *, https://b.com",
    });
    expect(policy.isAllowed("https://a.com")).toBe(true);
    expect(policy.isAllowed("https://b.com")).toBe(true);
    expect(policy.isAllowed("*")).toBe(false);
    expect(policy.isAllowed("https://evil.com")).toBe(false);
  });

  test("ajoute localhost et 127.0.0.1 uniquement si ALLOW_DEV_ORIGINS=true", () => {
    const prod = OriginPolicy.fromEnv({});
    expect(prod.isAllowed("http://localhost")).toBe(false);

    const dev = OriginPolicy.fromEnv({ ALLOW_DEV_ORIGINS: "true" });
    expect(dev.isAllowed("http://localhost")).toBe(true);
    expect(dev.isAllowed("http://127.0.0.1")).toBe(true);
  });
});

describe("Domain: MessagePolicy", () => {
  test("distingue les types autorisés et réservés à l'admin", () => {
    expect(MessagePolicy.isAllowedType("numLot")).toBe(true);
    expect(MessagePolicy.requiresAdmin("numLot")).toBe(true);
    expect(MessagePolicy.requiresAdmin("message")).toBe(false);
    expect(MessagePolicy.isAllowedType("arbitraryHack")).toBe(false);
  });

  test("normalise confirmEnchere en copiant myEnchere vers price si price absent", () => {
    const { normalizedMsg, mappedPrice } =
      MessagePolicy.normalizeConfirmEncherePayload("confirmEnchere", {
        lot: "4",
        myEnchere: 2500,
      });
    expect(mappedPrice).toBe(true);
    expect(normalizedMsg.price).toBe(2500);
  });
});

describe("UseCase: AuthenticateAdmin", () => {
  test("refuse si ADMIN_KEY vide (fail closed) et déconnecte après 3 échecs", async () => {
    const sessionRepository = new InMemorySessionRepository();
    await sessionRepository.save(SocketSession.createDefault("s1"));
    const disconnected = [];
    const gateway = {
      emitToRoom: () => {},
      disconnectSocket: (id) => {
        disconnected.push(id);
        return true;
      },
    };
    const roomPresenceService = {
      evictStaleAdmin: async () => {},
      broadcastUserList: async () => {},
    };

    const failClosed = new AuthenticateAdmin({
      sessionRepository,
      roomPresenceService,
      realtimeGateway: gateway,
      safeEqual: timingSafeEqual,
      adminKey: "",
      logger: silentLogger,
    });
    expect((await failClosed.execute({ socketId: "s1", key: "any" })).ok).toBe(
      false
    );

    const auth = new AuthenticateAdmin({
      sessionRepository,
      roomPresenceService,
      realtimeGateway: gateway,
      safeEqual: timingSafeEqual,
      adminKey: "secret",
      logger: silentLogger,
    });

    let res = await auth.execute({ socketId: "s1", key: "bad", currentFails: 0 });
    expect(res.ok).toBe(false);
    expect(res.shouldDisconnect).toBe(false);

    res = await auth.execute({
      socketId: "s1",
      key: "bad",
      currentFails: res.fails,
    });
    res = await auth.execute({
      socketId: "s1",
      key: "bad",
      currentFails: res.fails,
    });
    expect(res.shouldDisconnect).toBe(true);
    expect(disconnected).toEqual(["s1"]);
  });
});

describe("UseCase: BroadcastRoomMessage", () => {
  test("bloque les types admin pour un non-admin et met en cache numLot pour un admin", async () => {
    const sessionRepository = new InMemorySessionRepository();
    const lotStateRepository = new InMemoryLotStateRepository();
    const emitted = [];
    const gateway = {
      isSocketInRoom: () => true,
      emitToRoom: (room, event, payload) =>
        emitted.push({ room, event, payload }),
    };

    const useCase = new BroadcastRoomMessage({
      sessionRepository,
      lotStateRepository,
      realtimeGateway: gateway,
      logger: silentLogger,
    });

    await sessionRepository.save(
      new SocketSession({
        socketId: "bidder1",
        room: "auctav1",
        isAdmin: false,
      })
    );
    const denied = await useCase.execute({
      socketId: "bidder1",
      data: { room: "auctav1", type: "numLot", msg: { numLot: "1" } },
    });
    expect(denied.sent).toBe(false);

    await sessionRepository.save(
      new SocketSession({
        socketId: "admin1",
        pseudo: "Admin",
        room: "auctav1",
        isAdmin: true,
      })
    );
    const allowed = await useCase.execute({
      socketId: "admin1",
      data: { room: "auctav1", type: "numLot", msg: { numLot: "9" } },
    });
    expect(allowed.sent).toBe(true);
    expect(await lotStateRepository.findByRoom("auctav1")).toEqual({
      numLot: "9",
    });
    expect(emitted).toHaveLength(1);
  });
});
