const http = require('http');

const boundary = '----WebKitFormBoundary7MA4YWxkTrZu0gW';
const content = `--${boundary}\r\nContent-Disposition: form-data; name="fullname"\r\n\r\nTest User\r\n--${boundary}\r\nContent-Disposition: form-data; name="username"\r\n\r\ntestuser123\r\n--${boundary}\r\nContent-Disposition: form-data; name="email"\r\n\r\ntu@gmail.com\r\n--${boundary}\r\nContent-Disposition: form-data; name="password"\r\n\r\npass\r\n--${boundary}\r\nContent-Disposition: form-data; name="avatar"; filename="avatar.jpg"\r\nContent-Type: image/jpeg\r\n\r\nfakeimage\r\n--${boundary}\r\nContent-Disposition: form-data; name="coverImage"; filename="cover.jpg"\r\nContent-Type: image/jpeg\r\n\r\nfakeimage\r\n--${boundary}--\r\n`;

const req = http.request({
  hostname: 'localhost',
  port: 8000,
  path: '/api/v1/users/register',
  method: 'POST',
  headers: {
    'Content-Type': `multipart/form-data; boundary=${boundary}`,
    'Content-Length': Buffer.byteLength(content)
  }
}, res => {
  let body = '';
  res.on('data', chunk => body += chunk);
  res.on('end', () => console.log('Response Status:', res.statusCode, 'Body:', body));
});

req.on('error', e => console.error(`Problem with request: ${e.message}`));
req.write(content);
req.end();
