

import express from 'express';
import { upload } from '../controllers/attachaments';
import multer from 'multer';
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, './uploads');
    },
    filename: function (req, file, cb) {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
      cb(null, file.fieldname + '-' + uniqueSuffix);
    }
  });
  
  const uploadFile = multer({ storage: storage });
  





const attachmentRoute = express.Router();

attachmentRoute.post('/upload', uploadFile.single('file'), upload);




export default attachmentRoute;
