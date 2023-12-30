
import express from 'express';
import { encriptPayment, webHookReq } from '../controllers/payments';


const paymentRoute = express.Router();

paymentRoute.post('/encrypt', encriptPayment);
paymentRoute.post('/webhook', webHookReq);


export default paymentRoute;
