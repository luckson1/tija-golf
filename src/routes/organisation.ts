

import express from 'express';
import { getAllOrganisations, testOrganisations } from '../controllers/organisationControllers';





const orgRoute = express.Router();

orgRoute.get('/',  getAllOrganisations);

orgRoute.get('/all',  testOrganisations);


export default orgRoute;
