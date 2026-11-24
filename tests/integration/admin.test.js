const {
  TEST_ADMIN_KEY,
  createTestServer,
  connectClient,
  disconnectClient,
  waitFor,
} = require("../helpers/createServer");

let server, url;

beforeAll(async () => {
  server = await createTestServer();
  url = server.url;
});

afterAll(() => server.stop());

afterEach(async () => {
  await server.io
    .fetchSockets()
    .then((sockets) => Promise.all(sockets.map((s) => s.disconnect(true))));
  await server.sessionRepository.clear();
});

describe('événement "admin"', () => {
  test("marque le socket comme admin dans le store avec une clé valide", async () => {
    const client = await connectClient(url);
    const ack = await new Promise((resolve) => {
      client.emit("admin", "SuperAdmin", TEST_ADMIN_KEY, resolve);
    });
    expect(ack).toEqual({ ok: true });

    const all = await server.sessionRepository.findAll();
    const meta = all.find((m) => m.pseudo === "SuperAdmin");
    expect(meta).toBeDefined();
    expect(meta.isAdmin).toBe(true);

    await disconnectClient(client);
  });

  test("refuse un client qui fournit une mauvaise clé admin", async () => {
    const client = await connectClient(url);
    const ack = await new Promise((resolve) => {
      client.emit("admin", "FakeAdmin", "wrong-key", resolve);
    });
    expect(ack).toEqual({ ok: false });

    const meta = await server.sessionRepository.findById(client.id);
    expect(meta.isAdmin).toBe(false);

    await disconnectClient(client);
  });

  test('utilise "Admin" comme pseudo par défaut si aucun pseudo fourni', async () => {
    const client = await connectClient(url);
    await new Promise((resolve) => {
      client.emit("admin", "", TEST_ADMIN_KEY, resolve);
    });

    const all = await server.sessionRepository.findAll();
    const meta = all.find((m) => m.pseudo === "Admin");
    expect(meta?.isAdmin).toBe(true);

    await disconnectClient(client);
  });
});

describe("joinroom — admin", () => {
  test("broadcast userList({admin: socketId}) à la salle quand l'admin rejoint", async () => {
    const admin = await connectClient(url);
    const bidder = await connectClient(url);

    await new Promise((r) => admin.emit("admin", "Admin", TEST_ADMIN_KEY, r));
    bidder.emit("joinroom", "auctav42");
    await new Promise((r) => setTimeout(r, 100));

    const userListPromise = waitFor(bidder, "userList");
    admin.emit("joinroom", "auctav42");

    const data = await userListPromise;
    expect(data.admin).toBeDefined();
    expect(typeof data.admin).toBe("string");

    await disconnectClient(admin);
    await disconnectClient(bidder);
  });

  test("broadcast userList({admin: null}) si l'admin quitte la salle", async () => {
    const admin = await connectClient(url);
    const bidder = await connectClient(url);

    await new Promise((r) => admin.emit("admin", "Admin", TEST_ADMIN_KEY, r));
    admin.emit("joinroom", "auctav99");
    bidder.emit("joinroom", "auctav99");
    await new Promise((r) => setTimeout(r, 100));

    const userListPromise = waitFor(bidder, "userList");
    await disconnectClient(admin);

    const data = await userListPromise;
    expect(data.admin).toBeNull();

    await disconnectClient(bidder);
  });
});
