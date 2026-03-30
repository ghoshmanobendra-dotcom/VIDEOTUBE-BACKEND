import axios from 'axios';
import fs from 'fs';
import FormData from 'form-data';

const form = new FormData();
form.append('fullname', 'Test User');
form.append('username', 'testuser123');
form.append('email', 'testuser123@example.com');
form.append('password', 'password123');

form.append('avatar', fs.createReadStream('c:/Users/ghosh/OneDrive/Attachments/Desktop/VIDEOTUBE/VIDEOTUBE-FRONTEND/package.json'), 'package.json');
form.append('coverImage', fs.createReadStream('c:/Users/ghosh/OneDrive/Attachments/Desktop/VIDEOTUBE/VIDEOTUBE-FRONTEND/package.json'), 'package.json');

axios.post('http://localhost:8000/api/v1/users/register', form, {
    headers: {
        ...form.getHeaders()
    }
})
.then(res => console.log('Success:', res.data))
.catch(err => console.error('Error:', err.message, err.response?.data));
