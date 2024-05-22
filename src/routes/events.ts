import express from "express";
import {
  createEvent,
  getAllEvents,
  getEvent,
  listEvent,
  updateEvent,
} from "../controllers/eventsControllers";

const eventRoute = express.Router();

eventRoute.post("/", createEvent);
eventRoute.get("/", getAllEvents);
eventRoute.get("/:id", getEvent);
eventRoute.put("/:id", updateEvent);
eventRoute.post("/list", listEvent);

export default eventRoute;
