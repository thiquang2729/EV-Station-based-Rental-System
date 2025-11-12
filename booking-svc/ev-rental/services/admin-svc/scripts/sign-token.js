const fs = require('fs');
const jwt = require('jsonwebtoken');
const path = require('path');

// Đường dẫn tuyệt đối đến private key trong auth-svc
const keyPath = path.join(__dirname, '../auth-svc/keys/private.pem');
const privateKey = fs.readFileSync('./keys/private.pem', 'utf8');


// Payload mẫu
const payload = {
  iss: 'EV-Rental-Auth-Service',
  sub: 'user-id-for-testing',
  role: process.argv[2] || 'RENTER', // RENTER | STAFF | ADMIN
  fullName: 'Test User',
  email: 'test@example.com',
};

// Ký JWT bằng private key (RS256)
const token = jwt.sign(payload, privateKey, {
  algorithm: 'RS256',
  expiresIn: '1d',
  keyid: 'dev-key',
});

// In token ra console
console.log('\nGenerated token:');
console.log('='.repeat(60));
console.log(token);
console.log('='.repeat(60));
console.log(`\nUse it as:\nAuthorization: Bearer ${token}\n`);
