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
    console.log(socket.id)
  });
};