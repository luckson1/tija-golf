
import express from 'express';
import { createProfile, editProfile, fetchProfile } from '../controllers/profileControllers';


const profileRoute = express.Router();

profileRoute.post('/create-profile', createProfile);
profileRoute.put('/edit-profile/:id', editProfile);
profileRoute.put('/fetch-profile', fetchProfile);

export default profileRoute;
