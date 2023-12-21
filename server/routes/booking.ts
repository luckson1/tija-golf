// routes/bookings.ts
import express from 'express';
import { createBooking, getAllBookings, getBooking, updateBooking } from '../controllers/bookingControllers';


const bookingsroute = express.Router();

bookingsroute.post('/',  createBooking);
bookingsroute.get('/',  getAllBookings);
bookingsroute.get('/:id',  getBooking);
bookingsroute.put('/:id',  updateBooking);

export default bookingsroute;
