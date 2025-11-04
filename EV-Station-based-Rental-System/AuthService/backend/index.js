const express = require("express");
const cors = require("cors");
const app = express();
const dotenv = require("dotenv");
const cookieParser = require("cookie-parser");
const pool = require("./config/db");
const { initializeDatabase } = require("./database/setup");
const authRoute = require("./routes/auth");
const userRoute = require("./routes/user");
const userDocumentRoute = require("./routes/userDocument");
const uploadRoute = require("./routes/upload");
const complaintRoute = require("./routes/complaint");
const stationRoute = require("./routes/station");
dotenv.config();

const rawOrigins = process.env.CLIENT_URL
  ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
  : [];

const whitelist = rawOrigins.length > 0 ? rawOrigins : ["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:8060", "http://127.0.0.1:8060"];

const corsOptions = {
  origin(origin, callback) {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Not allowed by CORS: ${origin}`));
    }
  },
  credentials: true,
};

app.use(cors(corsOptions));
app.options("*", cors(corsOptions));
app.use(cookieParser());
app.use(express.json());

app.get("/health", async (req, res) => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();

    res.status(200).json({
      status: "ok",
      service: "auth-service",
      uptime: process.uptime(),
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Health check failed", error);
    res.status(503).json({
      status: "unhealthy",
      service: "auth-service",
      reason: "database_unreachable",
    });
  }
});

//ROUTES
app.use("/api/v1/auth", authRoute);
app.use("/api/v1/users", userRoute);
app.use("/api/v1/documents", userDocumentRoute);
app.use("/api/v1/upload", uploadRoute);
app.use("/api/v1/complaints", complaintRoute);
app.use("/api/v1/stations", stationRoute);

const startServer = async () => {
  try {
    const connection = await pool.getConnection();
    await connection.ping();
    connection.release();
    console.log("Connected to MySQL database");

    await initializeDatabase();

    const PORT = process.env.PORT || 8000;
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  } catch (error) {
    console.error("Unable to connect to MySQL database", error);
    process.exit(1);
  }
};

startServer();
