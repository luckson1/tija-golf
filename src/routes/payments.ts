
import express from 'express';
import { encriptPayment } from '../controllers/payments';


const paymentRoute = express.Router();

paymentRoute.post('/encript', encriptPayment);


export default paymentRoute;
