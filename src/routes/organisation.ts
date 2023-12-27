

import express from 'express';
import { getAllOrganisations, testOrganisations } from '../controllers/organisationControllers';





const orgRouter = express.Router();

orgRouter.get('/',  getAllOrganisations);

orgRouter.get('/all',  testOrganisations);


export default orgRouter;