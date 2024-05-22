import express from "express";
import {
  encriptPayment,
  getPaymentStatus,
  mpesaWebHookReq,
  updatePaymentStatusFromWebhook,
  webHookReq,
} from "../controllers/payments";

const paymentRoute = express.Router();

paymentRoute.post("/encrypt", encriptPayment);
paymentRoute.post("/webhook", webHookReq);
paymentRoute.post("/webhook/mpesa/:invoiceNumber", mpesaWebHookReq);
paymentRoute.get("/status/:invoiceNumber", getPaymentStatus);
paymentRoute.post(
  "/webhook/update/:invoiceNumber",
  updatePaymentStatusFromWebhook
);

export default paymentRoute;
