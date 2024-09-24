// routes/bookings.ts
import express from "express";
import {
  createBooking,
  getAllBookings,
  getAllOrganizationsEventBookings,
  getAllOrganizationsTeeBookings,
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
bookingsRoute.get("/events/all", getAllOrganizationsEventBookings);
bookingsRoute.get("/tee/all", getAllOrganizationsTeeBookings);

bookingsRoute.get("/tee", getTeeBookings);
bookingsRoute.get("/tee/:organizationId", getOrganizationsTeeBookings);
bookingsRoute.get("/events", getEventBookings);
bookingsRoute.get("/events/:id", getOrganizationsEventBookings);
bookingsRoute.get("/:id", getBooking);
bookingsRoute.put("/:id", updateBooking);

// ... rest of the file ...
export default bookingsRoute;
