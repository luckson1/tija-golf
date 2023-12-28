// routes/bookings.ts
import express from 'express';
import { createBooking, getAllBookings, getBooking, getUpcomingActivities, updateBooking, getTeeBookings } from '../controllers/bookingControllers';


const bookingsRoute = express.Router();

bookingsRoute.post('/',  createBooking);
bookingsRoute.get('/',  getAllBookings);
bookingsRoute.get('/:id',  getBooking);
bookingsRoute.put('/:id',  updateBooking);
bookingsRoute.get('/upcoming', getUpcomingActivities);
bookingsRoute.get('/tees', getTeeBookings);

export default bookingsRoute;
