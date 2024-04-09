import express from "express";
import {
  encriptPayment,
  mpesaWebHookReq,
  simulation,
  webHookReq,
} from "../controllers/payments";

const paymentRoute = express.Router();

paymentRoute.post("/encrypt", encriptPayment);
paymentRoute.post("/webhook", webHookReq);
paymentRoute.post("/webhook/mpesa/:invoiceNumber", mpesaWebHookReq);
paymentRoute.post("/simulate", simulation);

export default paymentRoute;
