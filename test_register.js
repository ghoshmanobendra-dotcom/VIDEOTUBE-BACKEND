import FormData from 'form-data';
import fs from 'fs';
import fetch from 'node-fetch'; // We can use global fetch if Node > 18, I'll use native fetch

const form = new FormData();
form.append('fullname', 'Test User');
form.append('username', 'testuser123');
form.append('email', 'testuser123@example.com');
form.append('password', 'password123');

// Write dummy images
fs.writeFileSync('avatar.jpg', 'fake image data');
fs.writeFileSync('cover.jpg', 'fake image data');

form.append('avatar', fs.createReadStream('avatar.jpg'));
form.append('coverImage', fs.createReadStream('cover.jpg'));

fetch('http://localhost:8000/api/v1/users/register', {
    method: 'POST',
    body: form,
    headers: form.getHeaders()
})
.then(res => res.text().then(text => ({status: res.status, text})))
.then(console.log)
.catch(console.error);
