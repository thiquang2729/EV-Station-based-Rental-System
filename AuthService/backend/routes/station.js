const express = require("express");
const fs = require("fs");
const path = require("path");
const router = express.Router();

// GET /api/v1/stations - trả về danh sách trạm từ file mẫu
router.get("/", async (req, res) => {
  try {
    const dataFilePath = path.join(__dirname, "..", "data", "stations.sample.json");
    const raw = fs.readFileSync(dataFilePath, "utf8");
    const stations = JSON.parse(raw);
    res.json({ data: stations });
  } catch (err) {
    console.error("Failed to read stations sample file", err);
    res.status(500).json({ message: "Không thể tải danh sách trạm" });
  }
});

module.exports = router;


