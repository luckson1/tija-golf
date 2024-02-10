

import express from 'express';
import { upload } from '../controllers/attachaments';
import multer from 'multer';
import path from "path"
import fs from "fs"


const uploadDirectory = path.join(__dirname, 'uploads');

// Ensure the upload directory exists
if (!fs.existsSync(uploadDirectory)) {
    fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename: function (req, file, cb) {
        cb(null, file.fieldname + '-' + Date.now());
    }
});
  
  const uploadFile = multer({ storage: storage });
  





const attachmentRoute = express.Router();

attachmentRoute.put('/upload', uploadFile.single('file'), upload);




export default attachmentRoute;
