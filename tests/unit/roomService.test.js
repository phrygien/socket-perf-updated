const SocketSession = require("../../src/domain/entities/SocketSession");
const InMemorySessionRepository = require("../../src/infrastructure/persistence/InMemorySessionRepository");
const RoomPresenceService = require("../../src/application/services/RoomPresenceService");
const GetRoomStats = require("../../src/application/use-cases/room/GetRoomStats");

const silentLogger = { info: () => {}, error: () => {} };

const createMockGateway = () => {
  const emitted = [];
  return {
    emitted,
    emitToRoom: (room, event, data) => emitted.push({ room, event, data }),
    emitToSocket: (socketId, event, data) =>
      emitted.push({ socketId, event, data }),
    disconnectSocket: () => false,
  };
};

let sessionRepository;
let gateway;
let roomPresenceService;
let getRoomStats;

beforeEach(async () => {
  sessionRepository = new InMemorySessionRepository();
  gateway = createMockGateway();
  roomPresenceService = new RoomPresenceService({
    sessionRepository,
    realtimeGateway: gateway,
    logger: silentLogger,
  });
  getRoomStats = new GetRoomStats({ sessionRepository });
});

describe("RoomPresenceService.getAdminOfRoom", () => {
  test("retourne null si aucun socket dans la salle", async () => {
    expect(await roomPresenceService.getAdminOfRoom("auctav1")).toBeNull();
  });

  test("retourne null si la salle existe mais sans admin", async () => {
    await sessionRepository.save(
      new SocketSession({
        socketId: "bidder1",
        pseudo: "Alice",
        room: "auctav1",
        isAdmin: false,
      })
    );
    expect(await roomPresenceService.getAdminOfRoom("auctav1")).toBeNull();
  });

  test("retourne le socketId de l'admin de la salle", async () => {
    await sessionRepository.save(
      new SocketSession({
        socketId: "admin1",
        pseudo: "Admin",
        room: "auctav1",
        isAdmin: true,
      })
    );
    await sessionRepository.save(
      new SocketSession({
        socketId: "bidder1",
        pseudo: "Alice",
        room: "auctav1",
        isAdmin: false,
      })
    );
    expect(await roomPresenceService.getAdminOfRoom("auctav1")).toBe("admin1");
  });

  test("ne retourne pas l'admin d'une autre salle", async () => {
    await sessionRepository.save(
      new SocketSession({
        socketId: "admin1",
        pseudo: "Admin",
        room: "auctav2",
        isAdmin: true,
      })
    );
    expect(await roomPresenceService.getAdminOfRoom("auctav1")).toBeNull();
  });

  test("retourne le premier admin si plusieurs sont présents", async () => {
    await sessionRepository.save(
      new SocketSession({
        socketId: "admin1",
        pseudo: "Admin1",
        room: "auctav1",
        isAdmin: true,
      })
    );
    await sessionRepository.save(
      new SocketSession({
        socketId: "admin2",
        pseudo: "Admin2",
        room: "auctav1",
        isAdmin: true,
      })
    );
    const result = await roomPresenceService.getAdminOfRoom("auctav1");
    expect(["admin1", "admin2"]).toContain(result);
  });
});

describe("RoomPresenceService.broadcastUserList", () => {
  test("émet userList({ admin: null }) si aucun admin dans la salle", async () => {
    await roomPresenceService.broadcastUserList("auctav1");
    expect(gateway.emitted).toHaveLength(1);
    expect(gateway.emitted[0]).toMatchObject({
      room: "auctav1",
      event: "userList",
      data: { admin: null },
    });
  });

  test("émet userList({ admin: socketId }) si un admin est présent", async () => {
    await sessionRepository.save(
      new SocketSession({
        socketId: "admin1",
        pseudo: "Admin",
        room: "auctav1",
        isAdmin: true,
      })
    );
    await roomPresenceService.broadcastUserList("auctav1");
    expect(gateway.emitted[0].data).toEqual({ admin: "admin1" });
  });

  test("cible bien la salle passée en paramètre", async () => {
    await roomPresenceService.broadcastUserList("auctav_follow");
    expect(gateway.emitted[0].room).toBe("auctav_follow");
  });
});

describe("GetRoomStats.getStats", () => {
  test("retourne un objet vide si aucun socket", async () => {
    expect(await getRoomStats.getStats()).toEqual({});
  });

  test("compte correctement les sockets par salle", async () => {
    await sessionRepository.save(
      new SocketSession({
        socketId: "s1",
        pseudo: "Admin",
        room: "auctav1",
        isAdmin: true,
      })
    );
    await sessionRepository.save(
      new SocketSession({
        socketId: "s2",
        pseudo: "Alice",
        room: "auctav1",
        isAdmin: false,
      })
    );
    await sessionRepository.save(
      new SocketSession({
        socketId: "s3",
        pseudo: "Bob",
        room: "auctav2",
        isAdmin: false,
      })
    );

    const stats = await getRoomStats.getStats();
    expect(stats["auctav1"].count).toBe(2);
    expect(stats["auctav1"].admins).toContain("Admin");
    expect(stats["auctav2"].count).toBe(1);
    expect(stats["auctav2"].admins).toHaveLength(0);
  });

  test('classe les sockets sans salle sous la clé "none"', async () => {
    await sessionRepository.save(
      new SocketSession({
        socketId: "s1",
        pseudo: "Ghost",
        room: null,
        isAdmin: false,
      })
    );
    const stats = await getRoomStats.getStats();
    expect(stats["none"].count).toBe(1);
  });
});
