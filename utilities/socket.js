const { verify } = require("jsonwebtoken");

module.exports = (io) => {
  io.use((socket, next) => {
    // Get jwt from socket handshake
    const token = socket.handshake.auth.token;
    try {
      // Decode JWT
      verify(token, process.env.JWT_AUTH);

      // Run next method
      next();
    } catch (error) {
      // Create new error object
      const err = new Error("not authorized");

      // Set err data
      err.data = error;

      // Apply next with error object
      next(err);
    }
  });

  // Handle socket connections
  io.on("connection", (socket) => {
    socket.on("chat-message", (e) => {
      try {
        const decoded = verify(socket.handshake.auth.token, process.env.JWT_AUTH);
        
        io.emit("chat-message", {
          displayname: decoded.displayname,
          text: e.text,
          type: "message-foreign"
        })
      } catch (error) {
        console.log(error)
      }
    });
  });
};
