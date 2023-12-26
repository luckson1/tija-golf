
import express from 'express';
import { createTee, getAllTees, getTee, updateTee } from '../controllers/teeContorollers';




const teesRoute = express.Router();

teesRoute.post('/', createTee);
teesRoute.get('/', getAllTees);
teesRoute.get('/:id', getTee);
teesRoute.put('/:id', updateTee);

export default teesRoute;
