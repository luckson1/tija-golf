
import { getAllOrganisations } from 'controllers/organisationControllers';
import express from 'express';





const orgRouter = express.Router();

orgRouter.get('/',  getAllOrganisations);


export default orgRouter;
