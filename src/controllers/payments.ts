import { z } from "zod";
import { Request, Response } from "express";
import { PaymentStatus, PrismaClient } from "@prisma/client";
import base64 from "base-64"; // Ensure you have base-64 installed
import { getUser } from "../utils";
import { format } from "date-fns";
// Adjust the path as necessary

interface WebhookResponse {
  Result: {
    ConversationID: string;
    OriginatorConversationID: string;
    ReferenceData?: {
      ReferenceItem: {
        Key: string;
      };
    };
    ResultCode: number;
    ResultDesc: string;
    ResultParameters?: {
      ResultParameter?: Array<{
        Key: string;
        Value?: string;
      }>;
    };
    ResultType: number;
    TransactionID: string;
  };
}
export interface PaymentStatusResponse {
  ResponseCode: string;
  ResponseDescription: string;
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResultCode: string | number;
  ResultDesc: string;
}
interface PaymentResponse {
  MerchantRequestID: string;
  CheckoutRequestID: string;
  ResponseDescription: string;
  ResponseCode: number;
  CustomerMessage: string;
}

export const passKey = process.env.MPESA_PASS_KEY!;
export const consumerKey = process.env.MPESA_CONSUMER_KEY!;
export const consumerSecret = process.env.MPESA_CONSUMER_SECRET!;
export const backendBaseUrl = process.env.BACKEND_BASE_URL!;
export const businessShortCode = process.env.BUSINESSCODE ?? "174379"; // Add this line

const prisma = new PrismaClient();

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

export const mpesaWebHookReq = async (req: Request, res: Response) => {
  try {
    const invoiceNumber = req.params.invoiceNumber;

    const body = req.body;
    await prisma.webhookJson.create({ data: { body } }); // Storing invoiceNumber along with the body
    // Validate the input using Zod
    const payload = webhookDataSchema.parse(body);
    const status: ("Completed" | "Failed")[] = ["Completed", "Failed"];
    const paymentStatus =
      payload.Body.stkCallback.ResultCode === 0 ? status[0] : status[1];
    const paymentData = {
      invoiceNumber,
      amount: Number(
        payload.Body.stkCallback.CallbackMetadata?.Item[0]?.Value ?? 0
      ),
      status: paymentStatus,
      checkoutRequestID: payload.Body.stkCallback.CheckoutRequestID,
    };

    const result = await prisma.$transaction(async (prisma) => {
      // Create payment record
      const payment = await prisma.payment.upsert({
        where: { invoiceNumber },
        update: paymentData,
        create: paymentData,
      });

      // Update booking or cart based on invoiceNumber prefix
      if (invoiceNumber.startsWith("E") || invoiceNumber.startsWith("T")) {
        await prisma.booking.update({
          where: { slug: invoiceNumber },
          data: { status: paymentStatus },
        });
      } else if (invoiceNumber.startsWith("C")) {
        await prisma.cart.update({
          where: { slug: invoiceNumber },
          data: { status: paymentStatus },
        });
      }

      return payment;
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

export const updatePaymentStatusFromWebhook = async (
  req: Request,
  res: Response
) => {
  try {
    // Assuming the body of the request is the WebhookResponse
    const webhookResponse: WebhookResponse = req.body;
    await prisma.webhookJson.create({
      data: {
        body: webhookResponse as any,
      },
    });
    const invoiceNumber = req.params.invoiceNumber;
    // Extract necessary data from the webhook response

    const resultCode = webhookResponse.Result.ResultCode;
    const resultParameters =
      webhookResponse?.Result?.ResultParameters?.ResultParameter;

    // Determine payment status based on resultCode
    const paymentStatus = resultCode === 0 ? "Completed" : "Failed";

    // Find amount and invoiceNumber from ResultParameters
    let amount = 0;

    resultParameters?.forEach((param) => {
      console.log(param.Key, param.Value);
      if (param.Key === "Amount" && param.Value) {
        amount = Number(param.Value);
      }
    });

    // Update payment record in the database
    await prisma.$transaction(async (prisma) => {
      const updatedPayment = await prisma.payment.upsert({
        where: { invoiceNumber },
        update: {
          status: paymentStatus,
          amount,
        },
        create: {
          invoiceNumber: invoiceNumber,
          status: paymentStatus,
          amount: amount,
        },
      });

      if (invoiceNumber.startsWith("E") || invoiceNumber.startsWith("T")) {
        await prisma.booking.update({
          where: { slug: invoiceNumber },
          data: { status: paymentStatus },
        });
      } else if (invoiceNumber.startsWith("C")) {
        await prisma.cart.update({
          where: { slug: invoiceNumber },
          data: { status: paymentStatus },
        });
      }

      return updatedPayment;
    });

    return res
      .status(200)
      .json({ message: "Payment status updated successfully" });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      console.log("Zod validation error", error.errors);
      return res.status(400).json(error.errors);
    }
    // Log and handle other types of errors
    console.error("Error updating payment status:", error);
    return res.status(500).send(error);
  }
};

const getBearerToken = async () => {
  try {
    const buffer = Buffer.from(`${consumerKey}:${consumerSecret}`);
    const auth = `Basic ${buffer.toString("base64")}`;

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/oauth/v1/generate?grant_type=client_credentials",
      {
        method: "GET",
        headers: {
          Authorization: auth,
        },
      }
    );

    if (response.status !== 200) {
      throw new Error("Something went wrong");
    }

    const data = await response.json();
    return data.access_token;
  } catch (error) {
    console.error("Error fetching bearer token:", error);
    throw error;
  }
};

// Define validation schemas
const sendPaymentRequestSchema = z.object({
  amount: z.number(),
  partyA: z.number(),
  phoneNumber: z.number(),
  transactionDesc: z.string(),
  invoiceNumber: z.string(),
});

const checkPaymentStatusSchema = z.object({
  invoiceNumber: z.string(),
});

const provideCodeSchema = z.object({
  paymentCode: z.string(),
  invoiceNumber: z.string(),
});

/**
 * @swagger
 * /api/payments/send:
 *   post:
 *     summary: Send a payment request
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               amount:
 *                 type: number
 *               partyA:
 *                 type: number
 *               phoneNumber:
 *                 type: number
 *               transactionDesc:
 *                 type: string
 *               invoiceNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment request sent successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export const sendPaymentRequest = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    // Validate request body
    const parsedBody = sendPaymentRequestSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json(parsedBody.error.errors);
    }

    const { amount, partyA, phoneNumber, transactionDesc, invoiceNumber } =
      parsedBody.data;

    const timestamp = format(new Date(), "yyyyMMddHHmmss");
    const password = base64.encode(businessShortCode + passKey + timestamp);
    const accessToken = await getBearerToken();
    const callBackUrl = `${backendBaseUrl}/api/payments/webhook/mpesa/${invoiceNumber}`;

    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpush/v1/processrequest",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          BusinessShortCode: businessShortCode,
          Password: password,
          Timestamp: timestamp,
          TransactionType: "CustomerPayBillOnline",
          Amount: amount,
          PartyA: partyA,
          PartyB: businessShortCode,
          PhoneNumber: phoneNumber,
          CallBackURL: callBackUrl,
          AccountReference: "TIJA GOLF LTD",
          TransactionDesc: transactionDesc,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.errorMessage || "Error occurred initializing payment";
      console.log("Payment initialization failed:", errorMessage);
      throw new Error(errorMessage);
    }

    const results: PaymentResponse = await response.json();
    const paymentData = {
      invoiceNumber,
      amount: Number(amount),
      checkoutRequestID: results.CheckoutRequestID,
    };

    await prisma.payment.upsert({
      where: { invoiceNumber },
      update: paymentData,
      create: paymentData,
    });

    await delay(30000);

    const status = await checkpaymentStatus(
      invoiceNumber,
      results.CheckoutRequestID
    );

    return res.status(200).json({ status });
  } catch (error) {
    console.error("Error sending payment request:", error);
    return res.status(500).send(error);
  }
};

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const checkpaymentStatus = async (
  invoiceNumber: string,
  id?: string
) => {
  const timestamp = format(new Date(), "yyyyMMddHHmmss");
  let checkoutRequestID: string | null | undefined;

  if (id) {
    checkoutRequestID = id;
  } else {
    const payment = await prisma.payment.findUnique({
      where: { invoiceNumber },
      select: { checkoutRequestID: true },
    });
    checkoutRequestID = payment?.checkoutRequestID;
  }

  const password = base64.encode(businessShortCode + passKey + timestamp);
  const accessToken = await getBearerToken();

  const fetchPaymentStatus = async () => {
    console.log(checkoutRequestID);
    const response = await fetch(
      "https://sandbox.safaricom.co.ke/mpesa/stkpushquery/v1/query",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${accessToken}`,
        },
        body: JSON.stringify({
          BusinessShortCode: businessShortCode,
          Password: password,
          Timestamp: timestamp,
          CheckoutRequestID: checkoutRequestID,
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage =
        errorData.errorMessage || "Error occurred checking payment status";
      console.error("Payment status check failed:", errorMessage);
      throw new Error(errorMessage);
    }

    return response.json();
  };

  let attempts = 0;
  while (attempts < 4) {
    try {
      const results: PaymentStatusResponse = await fetchPaymentStatus();
      const status =
        results.ResultCode === "0" || results.ResultCode === 0
          ? PaymentStatus.Completed
          : PaymentStatus.Failed;
      await prisma.$transaction([
        prisma.payment.update({
          where: {
            invoiceNumber,
          },
          data: {
            status,
            resultDescription: results.ResultDesc,
          },
        }),
        invoiceNumber.startsWith("C")
          ? prisma.cart.update({
              where: { slug: invoiceNumber },
              data: { status },
            })
          : prisma.booking.update({
              where: { slug: invoiceNumber },
              data: { status },
            }),
      ]);
      return status;
    } catch (error) {
      attempts++;
      if (attempts < 4) {
        console.log(`Retrying... (${attempts}/4)`);
        await delay(16000 / attempts); //
      } else {
        console.error(
          "Max retries reached. Error checking payment status:",
          error
        );
        throw error;
      }
    }
  }
};

/**
 * @swagger
 * /api/payments/check/{invoiceNumber}:
 *   post:
 *     summary: Check payment status
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: invoiceNumber
 *         schema:
 *           type: string
 *         required: true
 *         description: The invoice number of the payment
 *     responses:
 *       200:
 *         description: Payment status checked successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 status:
 *                   type: string
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */
export const checkPaymentStatusController = async (
  req: Request,
  res: Response
) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    // Get invoice number from request path parameters
    const { invoiceNumber } = req.params;
    if (!invoiceNumber) {
      return res.status(400).send("Invoice number is required");
    }
    const status = await checkpaymentStatus(invoiceNumber);
    return res.status(200).json({ status });
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).send(error);
  }
};

/**
 * @swagger
 * /code:
 *   post:
 *     summary: Provide payment code for an invoice
 *     tags: [Payments]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               paymentCode:
 *                 type: string
 *               invoiceNumber:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment code provided successfully
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const provideCode = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const userId = await getUser(token);
    if (!userId) return res.status(401).send("Unauthorized");

    // Validate request body
    const parsedBody = provideCodeSchema.safeParse(req.body);
    if (!parsedBody.success) {
      return res.status(400).json(parsedBody.error.errors);
    }

    const { paymentCode, invoiceNumber } = parsedBody.data;
    const status = "In_Review";
    await prisma.$transaction([
      prisma.payment.update({
        where: {
          invoiceNumber,
        },
        data: {
          status,
          paymentCode,
        },
      }),
      invoiceNumber.startsWith("C")
        ? prisma.cart.update({
            where: { slug: invoiceNumber },
            data: { status },
          })
        : prisma.booking.update({
            where: { slug: invoiceNumber },
            data: { status },
          }),
    ]);
    return res.status(200);
  } catch (error) {
    console.error("Error checking payment status:", error);
    return res.status(500).send(error);
  }
};
