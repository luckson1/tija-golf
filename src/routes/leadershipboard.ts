
import express from 'express';
import { getLatestBoard } from '../controllers/leadershipboard';



const leadershipBoardRoute = express.Router();


leadershipBoardRoute.get('/',  getLatestBoard);


export default leadershipBoardRoute;