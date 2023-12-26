
import express from 'express';
import { createTournament, getAllTournaments, getTournament, updateTournament } from '../controllers/tournamentControllers';


const tournamentRoute = express.Router();

tournamentRoute.post('/',  createTournament);
tournamentRoute.get('/',  getAllTournaments);
tournamentRoute.get('/:id',  getTournament);
tournamentRoute.put('/:id',  updateTournament);

export default tournamentRoute;
