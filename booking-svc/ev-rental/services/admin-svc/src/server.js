const express = require('express');
const app = express();
app.use(express.json());

const PORT = process.env.PORT || 4000;

// Dữ liệu mô phỏng
let vehicles = [
  { id: 1, name: 'EV Bike A', station: 'Station 1', status: 'Tốt', battery: 90 },
  { id: 2, name: 'EV Bike B', station: 'Station 1', status: 'Cần bảo trì', battery: 50 },
];

let reports = [
  { id: 1, vehicleId: 2, note: 'Xe bị trục trặc pin', resolved: false }
];

// Root endpoint
app.get('/', (_, res) => res.json({ 
  service: 'Admin Service', 
  version: '1.0.0',
  endpoints: [
    'GET /admin/vehicles - Danh sách xe',
    'GET /admin/reports - Danh sách báo cáo',
    'PUT /admin/reports/:id - Xử lý báo cáo',
    'GET /health - Health check'
  ]
}));

// API: xem tổng quan đội xe
app.get('/admin/vehicles', (_, res) => res.json(vehicles));

// API: xem báo cáo sự cố
app.get('/admin/reports', (_, res) => res.json(reports));

// API: cập nhật xử lý báo cáo
app.put('/admin/reports/:id', (req, res) => {
  const id = parseInt(req.params.id);
  const report = reports.find(r => r.id === id);
  if (!report) return res.status(404).json({ error: 'Không tìm thấy báo cáo' });

  report.resolved = true;
  res.json({ message: 'Đã xử lý báo cáo', report });
});

// Health check
app.get('/health', (_, res) => res.json({ ok: true }));

app.listen(PORT, () => console.log(`admin-svc running on :${PORT}`));
