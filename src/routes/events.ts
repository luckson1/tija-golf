
import express from 'express';
import { createEvent, getAllEvents, getEvent, updateEvent } from '../controllers/eventsControllers';




const eventRoute = express.Router();

eventRoute.post('/',  createEvent);
eventRoute.get('/',  getAllEvents);
eventRoute.get('/:id',  getEvent);
eventRoute.put('/:id',  updateEvent);

export default eventRoute;
