/*socket.js Alexander Toscano Ricardo*/

module.exports = (params) => {
  ({ http, app } = params);

  const io = require("socket.io")(http, {
    cors: {
      origin: "http://localhost:8080",
    },
  });

  io.on("connection", (socket) => {
    require("./routes")({ app, socket });

    socket.on("getVersion", () => {
      socket.emit("onVersion", { name: "Server", version: "1.0.0" });
    });

    socket.on("disconnect", (reason) => {
      if (reason === "io server disconnect") {
        // the disconnection was initiated by the server, you need to reconnect manually
        socket.connect();
      }
    });
  });
};
