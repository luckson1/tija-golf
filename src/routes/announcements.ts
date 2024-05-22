import express from "express";
import {
  getAllAnnouncements,
  getAnnouncementById,
  createAnnouncement,
  updateAnnouncement,
  deleteAnnouncement,
} from "../controllers/announcements";

const announcementRoute = express.Router();

announcementRoute.get("/", getAllAnnouncements);
announcementRoute.get("/:id", getAnnouncementById);
announcementRoute.post("/", createAnnouncement);
announcementRoute.put("/:id", updateAnnouncement);
announcementRoute.delete("/:id", deleteAnnouncement);

export default announcementRoute;
