
import express from 'express';
import { createEvent, getAllEvents, getEvent, updateEvent } from '../controllers/eventsControllers';




const eventRouter = express.Router();

eventRouter.post('/',  createEvent);
eventRouter.get('/',  getAllEvents);
eventRouter.get('/:id',  getEvent);
eventRouter.put('/:id',  updateEvent);

export default eventRouter;
