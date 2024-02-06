

import express from 'express';
import { getAllOrganisations, testOrganisations } from '../controllers/organisationControllers';





const orgRoute = express.Router();
orgRoute.get('/all',  testOrganisations);
orgRoute.get('/',  getAllOrganisations);




export default orgRoute;
