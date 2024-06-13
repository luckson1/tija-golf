import express from "express";
import {
  checkPaymentStatusController,
  mpesaWebHookReq,
  sendPaymentRequest,
  updatePaymentStatusFromWebhook,
} from "../controllers/payments";

const paymentRoute = express.Router();

paymentRoute.post("/webhook/mpesa/:invoiceNumber", mpesaWebHookReq);
paymentRoute.post(
  "/webhook/update/:invoiceNumber",
  updatePaymentStatusFromWebhook
);
paymentRoute.post("/sendPaymentRequest", sendPaymentRequest);
paymentRoute.post("/checkPaymentStatus", checkPaymentStatusController);

export default paymentRoute;
