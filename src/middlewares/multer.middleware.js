import multer from 'multer';
import fs from 'fs';

// Ensure the directory exists before multer tries to write to it
const dir = './public/temp';
if (!fs.existsSync(dir)){
    fs.mkdirSync(dir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, dir)
    },
    filename: function (req, file, cb) {
        cb(null, file.originalname)
    }
})

 export const upload = multer({ storage: storage })