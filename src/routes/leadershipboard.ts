import express from "express";
import {
  editLeaderboardPoint,
  getLatestBoard,
  uploadLeaderboard,
} from "../controllers/leadershipboard";

import multer from "multer";
import path from "path";
import fs from "fs";

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

const leadershipBoardRoute = express.Router();

leadershipBoardRoute.get("/", getLatestBoard);
leadershipBoardRoute.post(
  "/leaderboard/upload",
  uploadFile.single("file"),
  uploadLeaderboard
);
leadershipBoardRoute.put("/leaderboardpoint/:id", editLeaderboardPoint);

export default leadershipBoardRoute;
