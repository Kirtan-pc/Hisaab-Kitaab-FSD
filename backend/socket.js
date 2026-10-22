const { randomUUID } = require("node:crypto");
const { Server } = require("socket.io");
const { verifyAccessToken } = require("./middleware/authMiddleware");

function createSocketServer(server, allowedOrigins) {
  const io = new Server(server, {
    cors: { origin: allowedOrigins, methods: ["GET", "POST"] },
    maxHttpBufferSize: 4096,
    allowRequest: (request, callback) => {
      const origin = request.headers.origin;
      callback(null, !origin || allowedOrigins.includes(origin));
    },
  });

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      const auth = typeof token === "string" ? verifyAccessToken(token) : null;
      if (!auth) return next(new Error("Authentication required."));
      socket.data.auth = auth;
      return next();
    } catch (error) {
      if (
        error.name === "JsonWebTokenError" ||
        error.name === "TokenExpiredError" ||
        error.name === "NotBeforeError"
      ) {
        return next(new Error("Authentication required."));
      }
      return next(error);
    }
  });

  io.on("connection", (socket) => {
    const room = `shop:${socket.data.auth.shopId}`;
    const recentMessages = [];
    socket.join(room);

    socket.on("chatMessage", (payload, acknowledge) => {
      const reply = typeof acknowledge === "function" ? acknowledge : () => {};
      const now = Date.now();
      while (recentMessages.length && recentMessages[0] <= now - 10000) {
        recentMessages.shift();
      }
      if (recentMessages.length >= 5) {
        return reply({ error: "Please wait before sending another message." });
      }
      recentMessages.push(now);

      if (
        !payload ||
        typeof payload !== "object" ||
        Array.isArray(payload) ||
        typeof payload.text !== "string" ||
        !payload.text.trim() ||
        payload.text.trim().length > 500
      ) {
        return reply({ error: "Message must contain 1 to 500 characters." });
      }

      io.to(room).emit("chatMessage", {
        id: randomUUID(),
        senderId: socket.data.auth.shopId,
        text: payload.text.trim(),
        timestamp: new Date().toISOString(),
      });
      return reply({ ok: true });
    });
  });

  return io;
}

module.exports = { createSocketServer };
