import { z } from "zod";
import checkoutEncrypt from "@cellulant/checkout_encryption";
import { Request, Response } from "express";
import { PrismaClient } from "@prisma/client";

const apiSchema = z.object({
  msisdn: z.string(),
  account_number: z.string(),
  country_code: z.string().length(3),
  currency_code: z.string().length(3),
  customer_first_name: z.string(),
  customer_last_name: z.string(),
  due_date: z.string(), // You may want to use a custom validation for date format
  merchant_transaction_id: z.string(),
  payment_option_code: z.string().optional(),
  callback_url: z.string().url(),
  pending_redirect_url: z.string().url().optional(),
  request_amount: z.number(),
  request_description: z.string(),
  service_code: z.string(),
  success_redirect_url: z.string().url(),
  fail_redirect_url: z.string().url(),
  language_code: z.enum(["fr", "en", "ar", "pt"]),
  charge_beneficiaries: z.array(z.unknown()).optional(), // Replace z.unknown() with the appropriate schema for the objects in the array
});

type Payment = z.infer<typeof apiSchema>;

const prisma = new PrismaClient();

// const apiSchema = z.object({
//   merchantTransactionID: z.string(),
//   requestAmount: z.string(), // Assuming this should be a string representing a numerical value
//   currencyCode: z.string(),
//   accountNumber: z.string(),
//   serviceCode: z.string(),
//   countryCode: z.string(),
//   dueDate: z.string().optional(), // Assuming the date is in string format
//   payerClientCode: z.string().optional(),
//   requestDescription: z.string().optional(),
//   languageCode: z.string().optional(),
//   MSISDN: z.string(),
//   customerFirstName: z.string(),
//   customerLastName: z.string(),
//   customerEmail: z.string().email(),
//   successRedirectUrl: z.string(),
//   pendingRedirectUrl: z.string().optional(),
//   failRedirectUrl: z.string(),
//   paymentWebhookUrl: z.string(),
//   extraData: z.record(z.any()).optional(), // JSON is represented as a record of any type
// });
const callbackMetadataItemSchema = z.object({
  Name: z.string(),
  Value: z.union([z.number(), z.string()]).optional().nullable(), // Make Value optional
});
const stkCallbackSchema = z.object({
  MerchantRequestID: z.string(),
  CheckoutRequestID: z.string(),
  ResultCode: z.number(),
  ResultDesc: z.string(),
  CallbackMetadata: z
    .object({
      Item: z.array(callbackMetadataItemSchema),
    })
    .optional(), // Not optional, as it's part of the successful transaction data
});

const bodySchema = z.object({
  stkCallback: stkCallbackSchema,
});

const webhookDataSchema = z.object({
  Body: bodySchema,
});

type WebhookData = z.infer<typeof webhookDataSchema>;
const webhookRequestSchema = z.object({
  request_amount: z.number(),
  account_number: z.string(),
  original_request_amount: z.number(),

  amount_paid: z.number(),
  service_charge_amount: z.number(),

  service_code: z.string(),
  request_status_code: z.enum([
    "177",
    "178",
    "179",
    "129",
    "180",
    "183",
    "188",
  ]),
  request_status_description: z.string(),
  msisdn: z.string(),
  payments: z.array(z.unknown()), // Replace with actual schema for payment objects
  failed_payments: z.array(z.unknown()), // Replace with actual schema for failed payment objects
  status_date: z.string().optional(), // You may want to use a custom validation for date format
  country_abbrev: z.string().length(2),
  errors: z
    .array(
      z.object({
        customer_name: z.string(),
        account_number: z.string(),
        cpp_transaction_id: z.string(),
        currency_code: z.string().length(3),
        payer_client_code: z.string(),
        payer_client_name: z.string(),
        amount_paid: z.number(),
        service_code: z.string(),
        date_payment_received: z.string(), // You may want to use a custom validation for date format
        msisdn: z.string(),
        payer_transaction_id: z.string(),
        error: z.string(),
      })
    )
    .optional(),
});

type PaymentResponse = z.infer<typeof webhookRequestSchema>;

export const encriptPayment = async (req: Request, res: Response) => {
  // const accessKey = process.env.APPSETTING_accessKey;
  const IVKey = process.env.APPSETTING_IVKey;
  const secretKey = process.env.APPSETTING_secretKey;
  const algorithm = "aes-256-cbc";
  const encryption =
    IVKey && secretKey
      ? new checkoutEncrypt.Encryption(IVKey, secretKey, algorithm)
      : null;
  try {
    // Validate the input using Zod

    const payloadObj = apiSchema.parse(req.body);
    const toEncrypt = { ...payloadObj, due_date: undefined };
    const payloadStr = JSON.stringify(toEncrypt);

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
    console.log("payment got here");
    // Validate the input using Zod
    console.log("request", req);
    const payloadObj = webhookRequestSchema.parse(req.body);
    const booking = await prisma.booking.update({
      where: {
        bookingRef: Number(payloadObj.account_number),
      },

      data: {
        status:
          payloadObj.request_status_code === "180"
            ? "Rejected"
            : payloadObj.request_status_code === "129"
            ? "Expired"
            : payloadObj.request_status_code === "177"
            ? "Partial"
            : payloadObj.request_status_code === "178"
            ? "Completed"
            : payloadObj.request_status_code === "179"
            ? "Refunded"
            : payloadObj.request_status_code === "183"
            ? "Accepted"
            : payloadObj.request_status_code === "188"
            ? "Received"
            : "Failed",
      },
    });
    const payment = await prisma.payment.update({
      where: {
        bookingId: booking.id,
      },
      data: {
        status:
          payloadObj.request_status_code === "180"
            ? "Rejected"
            : payloadObj.request_status_code === "129"
            ? "Expired"
            : payloadObj.request_status_code === "177"
            ? "Partial"
            : payloadObj.request_status_code === "178"
            ? "Completed"
            : payloadObj.request_status_code === "179"
            ? "Refunded"
            : payloadObj.request_status_code === "183"
            ? "Accepted"
            : payloadObj.request_status_code === "188"
            ? "Received"
            : "Failed",
      },
    });
    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("validation");
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }
    console.log("others");
    // Handle other types of errors
    res.status(500).send(error);
  }
};
export const mpesaWebHookReq = async (req: Request, res: Response) => {
  try {
    const invoiceNumber = req.params.invoiceNumber;
    console.log(req.params); // Accessing invoiceNumber from the request parameters
    const body = req.body;
    await prisma.webhookJson.create({ data: { body } }); // Storing invoiceNumber along with the body
    // Validate the input using Zod
    const payload = webhookDataSchema.parse(body);
    const status: ("Completed" | "Failed")[] = ["Completed", "Failed"];
    const paymentData = {
      invoiceNumber, // Including invoiceNumber in the payment data
      amount: Number(
        payload.Body.stkCallback.CallbackMetadata?.Item[0]?.Value ?? 0
      ),
      status: payload.Body.stkCallback.ResultCode === 0 ? status[0] : status[1],
      checkoutRequestID: payload.Body.stkCallback.CheckoutRequestID,
    };

    const result = await prisma.$transaction(async (prisma) => {
      return prisma.payment.create({ data: paymentData });
    });

    return res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("validation", error.errors);
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }
    console.log("others", error);
    // Handle other types of errors
    res.status(500).send(error);
  }
};
export const simulation = async (req: Request, res: Response) => {
  try {
    const idSchema = z.object({ bookingRef: z.number() });
    const { bookingRef } = idSchema.parse(req.body);
    const booking = await prisma.booking.update({
      where: {
        bookingRef,
      },

      data: {
        status: "Completed",
      },
    });
    const payment = await prisma.payment.update({
      where: {
        bookingId: booking.id,
      },
      data: {
        status: "Completed",
      },
    });
    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log("validation");
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }
    console.log("others");
    // Handle other types of errors
    res.status(500).send(error);
  }
};
