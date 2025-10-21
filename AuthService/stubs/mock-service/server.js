const http = require("http");

const port = Number(process.env.PORT || 3000);
const serviceKind = (process.env.SERVICE_KIND || "generic").toLowerCase();

const respondJson = (res, status, payload) => {
  res.writeHead(status, {
    "Content-Type": "application/json",
  });
  res.end(JSON.stringify(payload));
};

const healthResponse = (res) =>
  respondJson(res, 200, {
    status: "ok",
    service: serviceKind,
    timestamp: new Date().toISOString(),
  });

const rentalsResponse = (res) =>
  respondJson(res, 200, {
    data: [
      { id: "booking-1", vehicleId: "EV-101", stationId: "station-a", status: "CONFIRMED" },
      { id: "booking-2", vehicleId: "EV-205", stationId: "station-b", status: "IN_PROGRESS" },
    ],
    source: "rental-svc",
  });

const rentalStationsResponse = (res) =>
  respondJson(res, 200, {
    data: [
      { id: "station-a", name: "Central Station", availableSlots: 5, source: "rental-svc" },
      { id: "station-b", name: "Airport Station", availableSlots: 3, source: "rental-svc" },
    ],
  });

const fleetVehiclesResponse = (res) =>
  respondJson(res, 200, {
    data: [
      { id: "EV-101", model: "Model 3", status: "AVAILABLE" },
      { id: "EV-205", model: "Model Y", status: "MAINTENANCE" },
    ],
    source: "fleet-svc",
  });

const fleetStationsResponse = (res) =>
  respondJson(res, 200, {
    data: [
      { id: "station-a", chargers: 8, occupancy: 3, source: "fleet-svc" },
      { id: "station-c", chargers: 4, occupancy: 2, source: "fleet-svc" },
    ],
  });

const adminResponse = (res) =>
  respondJson(res, 200, {
    data: {
      totalUsers: 329,
      activeRentals: 42,
      blockedUsers: 3,
    },
    source: "admin-svc",
  });

const notFoundResponse = (res) =>
  respondJson(res, 404, {
    error: "Not Found",
    service: serviceKind,
  });

const server = http.createServer((req, res) => {
  if (req.method === "GET" && req.url.startsWith("/health")) {
    return healthResponse(res);
  }

  if (req.method === "GET" && serviceKind === "rental") {
    if (req.url.startsWith("/api/v1/bookings")) {
      return rentalsResponse(res);
    }
    if (req.url.startsWith("/api/v1/stations")) {
      return rentalStationsResponse(res);
    }
  }

  if (req.method === "GET" && serviceKind === "fleet") {
    if (req.url.startsWith("/api/v1/vehicles")) {
      return fleetVehiclesResponse(res);
    }
    if (req.url.startsWith("/api/v1/stations")) {
      return fleetStationsResponse(res);
    }
  }

  if (req.method === "GET" && serviceKind === "admin") {
    if (req.url.startsWith("/api/v1/admin")) {
      return adminResponse(res);
    }
  }

  return notFoundResponse(res);
});

server.listen(port, () => {
  console.log(`[mock-service] ${serviceKind} listening on port ${port}`);
});
