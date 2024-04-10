import express from "express";
import {
  encriptPayment,
  getPaymentStatus,
  mpesaWebHookReq,
  webHookReq,
} from "../controllers/payments";

const paymentRoute = express.Router();

paymentRoute.post("/encrypt", encriptPayment);
paymentRoute.post("/webhook", webHookReq);
paymentRoute.post("/webhook/mpesa/:invoiceNumber", mpesaWebHookReq);
paymentRoute.get("/status/:invoiceNumber", getPaymentStatus);

export default paymentRoute;
