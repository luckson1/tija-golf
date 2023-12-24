import { createProfile, editProfile } from 'controllers/profileControllers';
import express from 'express';


const profileRoute = express.Router();

profileRoute.post('/create-profile', createProfile);
profileRoute.put('/edit-profile/:id', editProfile);
profileRoute.put('/fetch-profile', editProfile);

export default profileRoute;
