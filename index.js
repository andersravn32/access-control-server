const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const morgan = require("morgan");
const helmet = require("helmet");
const http = require("http");
const database = require("./utilities/database");

// Create express app and mount on http instance
const app = express();
const server = http.createServer(app);
const { Server } = require("socket.io");

// Init method
const init = async () => {
  // Configure dotenv
  dotenv.config();

  // Create database connection pool
  await database.connect();

  // Set trust proxy flag for IP logging
  app.set("trust proxy", true);

  // Enable morgan
  app.use(morgan("common"));

  // Enable helmet
  app.use(helmet());

  // Configure cors
  app.use(cors({ origin: "*" }));

  // Configure express body-parser
  app.use(express.urlencoded({ extended: false }));
  app.use(express.json());

  // Add Socket.io server instance
  const io = new Server(server, {
    cors: {
      origin: "*",
    },
  });

  // Listen to port provided as environment variable
  server.listen(process.env.PORT, () => {
    !process.env.NODE_ENV
      ? console.log(`Server is running on port ${process.env.PORT}`)
      : null;
  });
};

init();
