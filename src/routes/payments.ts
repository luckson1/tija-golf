
import express from 'express';
import { encriptPayment } from '../controllers/payments';


const paymentRoute = express.Router();

paymentRoute.post('/encrypt', encriptPayment);


export default paymentRoute;
