
import express from 'express';
import { createProfile, editProfile, fetchProfile, testProfile } from '../controllers/profileControllers';


const profileRoute = express.Router();

profileRoute.post('/create', createProfile);
profileRoute.put('/', editProfile);
profileRoute.get('/', fetchProfile);
profileRoute.get('/test', testProfile);

export default profileRoute;
