const { generateKeyPairSync } = require('crypto');
const fs = require('fs');
const path = require('path');

// Tạo cặp khóa RSA 2048-bit
const { privateKey, publicKey } = generateKeyPairSync('rsa', {
  modulusLength: 2048,
  publicKeyEncoding: { type: 'spki', format: 'pem' },
  privateKeyEncoding: { type: 'pkcs8', format: 'pem' },
});

// Xác định thư mục keys
const keysDir = path.join(__dirname, '../keys');
if (!fs.existsSync(keysDir)) fs.mkdirSync(keysDir, { recursive: true });

// Ghi file PEM
fs.writeFileSync(path.join(keysDir, 'private.pem'), privateKey);
fs.writeFileSync(path.join(keysDir, 'public.pem'), publicKey);

// Sinh JWKS (giản lược cho dev)
const jwks = {
  keys: [
    {
      kty: 'RSA',
      use: 'sig',
      kid: 'dev-key',
      alg: 'RS256',
      n: Buffer.from(publicKey)
        .toString('base64')
        .replace(/=+$/, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_'),
      e: 'AQAB',
    },
  ],
};

// Ghi JWKS
fs.writeFileSync(path.join(keysDir, 'jwks.json'), JSON.stringify(jwks, null, 2));

console.log('✅ Tạo thành công private.pem, public.pem, và jwks.json trong thư mục keys/');
