const https = require('https');

let cachedToken = null;
let cachedDataUrl = null;

const fetchToken = async (forceRefresh = false) => {
  if (cachedToken && cachedDataUrl && !forceRefresh) {
    return { token: cachedToken, dataUrl: cachedDataUrl };
  }

  const studentId = process.env.STUDENT_ID || 'E0223033';
  const password = process.env.STUDENT_PASSWORD || '199637';
  const set = process.env.STUDENT_SET || 'setA';
  const baseUrl = process.env.API_BASE_URL || 'https://t4e-testserver.onrender.com/api';

  return new Promise((resolve, reject) => {
    const url = new URL(`${baseUrl}/public/token`);
    const data = JSON.stringify({ studentId, password, set });

    const options = {
      hostname: url.hostname,
      path: url.pathname,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': data.length
      }
    };

    const req = https.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const parsed = JSON.parse(body);
            if (parsed.token) {
              cachedToken = parsed.token;
              cachedDataUrl = parsed.dataUrl || '/private/setA';
              resolve({ token: cachedToken, dataUrl: cachedDataUrl });
            } else {
              reject(new Error('Token not found in response'));
            }
          } catch (e) {
            reject(new Error('Invalid JSON response'));
          }
        } else {
          console.warn(`External API Auth failed with status ${res.statusCode}. Falling back to mock token.`);
          cachedToken = 'mock-jwt-token-for-testing';
          cachedDataUrl = '/private/setA';
          resolve({ token: cachedToken, dataUrl: cachedDataUrl });
        }
      });
    });

    req.on('error', (err) => {
      console.warn(`External API Connection Error: ${err.message}. Falling back to mock token.`);
      cachedToken = 'mock-jwt-token-for-testing';
      cachedDataUrl = '/private/setA';
      resolve({ token: cachedToken, dataUrl: cachedDataUrl });
    });

    req.write(data);
    req.end();
  });
};

const invalidateToken = () => {
  cachedToken = null;
};

module.exports = {
  fetchToken,
  invalidateToken
};
