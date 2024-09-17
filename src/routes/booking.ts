// routes/bookings.ts
import express from "express";
import {
  createBooking,
  getAllBookings,
  getBooking,
  getEventBookings,
  getOrganizationsEventBookings,
  getOrganizationsTeeBookings,
  getTeeBookings,
  getUpcomingActivities,
  updateBooking,
} from "../controllers/bookingControllers";

const bookingsRoute = express.Router();

bookingsRoute.post("/", createBooking);
bookingsRoute.get("/", getAllBookings);
bookingsRoute.get("/upcoming", getUpcomingActivities);
bookingsRoute.get("/tee", getTeeBookings);
bookingsRoute.get("/tee/:organizationId", getOrganizationsTeeBookings);
bookingsRoute.get("/events/:id", getOrganizationsEventBookings);
bookingsRoute.get("/events", getEventBookings);
bookingsRoute.get("/:id", getBooking);
bookingsRoute.put("/:id", updateBooking);

export default bookingsRoute;
