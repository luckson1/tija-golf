import express from "express";
import {
  checkPaymentStatusController,
  mpesaWebHookReq,
  provideCode,
  sendPaymentRequest,
  updatePaymentStatusFromWebhook,
  getAllPayments,
  getPaymentByInvoiceNumber,
} from "../controllers/payments";

const paymentRoute = express.Router();

paymentRoute.post("/webhook/mpesa/:invoiceNumber", mpesaWebHookReq);
paymentRoute.post(
  "/webhook/update/:invoiceNumber",
  updatePaymentStatusFromWebhook
);
paymentRoute.post("/send", sendPaymentRequest);
paymentRoute.post("/check/:invoiceNumber", checkPaymentStatusController);
paymentRoute.post("/code", provideCode);
paymentRoute.get("/", getAllPayments);
paymentRoute.get("/:invoiceNumber", getPaymentByInvoiceNumber);

export default paymentRoute;
