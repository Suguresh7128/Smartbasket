const fs = require('fs');
const path = require('path');

(async () => {
  const email = process.env.ADMIN_EMAIL || 'admin@smartbasket.in';
  const password = process.env.ADMIN_PASSWORD || 'change-this-secure-password';
  const base = `http://localhost:${process.env.PORT || 5000}`;

  console.log('Logging in as', email);
  const loginRes = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'content-type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const loginJson = await loginRes.json();
  console.log('Login response:', loginJson);
  if (!loginJson.success) return process.exit(1);
  const token = loginJson.data.accessToken;

  const filePath = path.join(__dirname, '..', 'test_assets', 'test.png');
  if (!fs.existsSync(filePath)) {
    console.error('Test image not found:', filePath);
    return process.exit(1);
  }

  // For local testing we send the base64 image in JSON body (handled by controller fallback)
  const raw = fs.readFileSync(filePath, { encoding: 'utf8' });
  const b64 = raw.replace(/\s+/g, '');
  const payload = { imageBase64: `data:image/png;base64,${b64}` };

  console.log('Uploading test bill (JSON base64)...');
  const uploadRes = await fetch(`${base}/api/bills/upload`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'content-type': 'application/json' },
    body: JSON.stringify(payload),
  });
  const uploadJson = await uploadRes.json();
  console.log('Upload response:', uploadJson);
})();
