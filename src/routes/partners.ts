
import express from 'express';
import { createPartner, getAllPartners, getPartner, updatePartner } from '../controllers/partners';


const partnerRoute = express.Router();

partnerRoute.post('/',  createPartner);
partnerRoute.get('/',  getAllPartners);
partnerRoute.get('/:id',  getPartner);
partnerRoute.put('/:id',  updatePartner);

export default partnerRoute;
