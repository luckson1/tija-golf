
import express from 'express';
import { encriptPayment, simulation, webHookReq } from '../controllers/payments';


const paymentRoute = express.Router();

paymentRoute.post('/encrypt', encriptPayment);
paymentRoute.post('/webhook', webHookReq);
paymentRoute.post('/simulate', simulation);


export default paymentRoute;
