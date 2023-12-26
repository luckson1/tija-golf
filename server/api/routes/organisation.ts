

import express from 'express';
import { getAllOrganisations } from '../controllers/organisationControllers';





const orgRouter = express.Router();

orgRouter.get('/',  getAllOrganisations);


export default orgRouter;
