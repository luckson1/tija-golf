import { z } from "zod";
import checkoutEncrypt from "@cellulant/checkout_encryption";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";
// const apiSchema = z.object({
//   merchant_transaction_id: z.string(),
//   account_number: z.string(),
//   msisdn: z.string(),
//   country_code: z.string().length(3),
//   currency_code: z.string().length(3),
//   due_date: z.string(), // You might want to use a custom validator for date format
//   request_amount: z.number(),
//   service_code: z.string(),
//   callback_url: z.string(),
//   success_redirect_url: z.string(),
//   fail_redirect_url: z.string(),
//   customer_first_name: z.string().optional(),
//   customer_last_name: z.string().optional(),
//   customer_email: z.string().email().optional(),
//   payment_option_code: z.string().optional(),
//   pending_redirect_url: z.string().optional(),
//   request_description: z.string().optional(),
//   language_code: z.enum(['fr', 'en', 'ar', 'pt']).optional(),
//   prefill_msisdn: z.boolean().optional().default(true),
// });

const prisma = new PrismaClient();

const apiSchema = z.object({
  merchantTransactionID: z.string(),
  requestAmount: z.string(), // Assuming this should be a string representing a numerical value
  currencyCode: z.string(),
  accountNumber: z.string(),
  serviceCode: z.string(),
  countryCode: z.string(),
  dueDate: z.string().optional(), // Assuming the date is in string format
  payerClientCode: z.string().optional(),
  requestDescription: z.string().optional(),
  languageCode: z.string().optional(),
  MSISDN: z.string(),
  customerFirstName: z.string(),
  customerLastName: z.string(),
  customerEmail: z.string().email(),
  successRedirectUrl: z.string(),
  pendingRedirectUrl: z.string().optional(),
  failRedirectUrl: z.string(),
  paymentWebhookUrl: z.string(),
  extraData: z.record(z.any()).optional(), // JSON is represented as a record of any type
});

const webhookRequestSchema = z.object({
  merchantTransactionID: z.string(),
  requestAmount: z.string(),
  currencyCode: z.string(),
  accountNumber: z.string(),
  serviceCode: z.string(),
  countryCode: z.string(),
  requestStatusCode: z.number(),
  dueDate: z.string().optional(),
  payerClientCode: z.string().optional(),
  requestDescription: z.string().optional(),
  languageCode: z.string().optional(),
  MSISDN: z.string(),
  customerFirstName: z.string(),
  customerLastName: z.string(),
  customerEmail: z.string().email(),
  successRedirectUrl: z.string().url(),
  failRedirectUrl: z.string().url(),
  paymentWebhookUrl: z.string().url(),
  extraData: z.record(z.unknown()).optional(), // JSON is a record type with unknown values
});
export const encriptPayment = async (req: Request, res: Response) => {
  const accessKey = process.env.ACCESS_KEY;
  const IVKey = process.env.IVKey;
  const secretKey = process.env.secretKey;
  const algorithm = "aes-256-cbc";
  const encryption =
    IVKey && secretKey
      ? new checkoutEncrypt.Encryption(IVKey, secretKey, algorithm)
      : null;
  try {
    // Validate the input using Zod
    const payloadObj = apiSchema.parse(req.body);

    const payloadStr = JSON.stringify(payloadObj);
    console.log("IVKey:", IVKey, "secretKey:", secretKey);
    var result = encryption?.encrypt(payloadStr);
    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    // Handle other types of errors
    res.status(500).send(error);
  }
};
export const webHookReq = async (req: Request, res: Response) => {
  try {
    // Validate the input using Zod
    const payloadObj = webhookRequestSchema.parse(req.body);
    const payment = await prisma.payment.update({
      where: {
        id: payloadObj.accountNumber,
      },
      data: {
        status:
          payloadObj.requestStatusCode === 99
            ? "Failed"
            : payloadObj.requestStatusCode === 129
            ? "Expired"
            : payloadObj.requestStatusCode === 176
            ? "Partial"
            : payloadObj.requestStatusCode === 178
            ? "Completed"
            : payloadObj.requestStatusCode === 179
            ? "Refunded"
            : "Failed",
      },
    });
    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    // Handle other types of errors
    res.status(500).send(error);
  }
};