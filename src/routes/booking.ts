// routes/bookings.ts
import express from 'express';
import { createBooking, getAllBookings, getBooking, getEventBookings, getTeeBookings, getUpcomingActivities, updateBooking } from '../controllers/bookingControllers';


const bookingsRoute = express.Router();

bookingsRoute.post('/',  createBooking);
bookingsRoute.get('/upcoming', getUpcomingActivities);
bookingsRoute.get('/tee', getTeeBookings);
bookingsRoute.get('/events', getEventBookings);
bookingsRoute.get('/:id',  getBooking);
bookingsRoute.put('/:id',  updateBooking);
bookingsRoute.get('/',  getAllBookings);


export default bookingsRoute;
