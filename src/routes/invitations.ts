import express from "express";
import multer from "multer";
import path from "path";
import fs from "fs";
import { csvInvite, textInvite } from "../controllers/invitations";

const uploadDirectory = path.join(__dirname, "uploads");

// Ensure the upload directory exists
if (!fs.existsSync(uploadDirectory)) {
  fs.mkdirSync(uploadDirectory, { recursive: true });
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadDirectory);
  },
  filename: function (req, file, cb) {
    cb(null, file.fieldname + "-" + Date.now());
  },
});

const uploadFile = multer({ storage: storage });

const invitationsRouter = express.Router();

// Route for inviting multiple users by email
invitationsRouter.post("/", textInvite);

// Route for inviting users from CSV file
invitationsRouter.post("/csv", uploadFile.single("file"), csvInvite);

export default invitationsRouter;
