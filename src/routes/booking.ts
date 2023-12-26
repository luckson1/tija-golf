// routes/bookings.ts
import express from 'express';
import { createBooking, getAllBookings, getBooking, getUpcomingActivities, updateBooking } from '../controllers/bookingControllers';


const bookingsRoute = express.Router();

bookingsRoute.post('/',  createBooking);
bookingsRoute.get('/',  getAllBookings);
bookingsRoute.get('/:id',  getBooking);
bookingsRoute.put('/:id',  updateBooking);
bookingsRoute.get('/upcoming', getUpcomingActivities);

export default bookingsRoute;
