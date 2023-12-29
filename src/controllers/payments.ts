import { z } from 'zod';
import checkoutEncrypt from '@cellulant/checkout_encryption' 
import { Request, Response } from 'express';
const apiSchema = z.object({
  merchant_transaction_id: z.string(),
  account_number: z.string(),
  msisdn: z.string(),
  country_code: z.string().length(3),
  currency_code: z.string().length(3),
  due_date: z.string(), // You might want to use a custom validator for date format
  request_amount: z.number(),
  service_code: z.string(),
  callback_url: z.string(),
  success_redirect_url: z.string(),
  fail_redirect_url: z.string(),
  customer_first_name: z.string().optional(),
  customer_last_name: z.string().optional(),
  customer_email: z.string().email().optional(),
  payment_option_code: z.string().optional(),
  pending_redirect_url: z.string().optional(),
  request_description: z.string().optional(),
  language_code: z.enum(['fr', 'en', 'ar', 'pt']).optional(),
  prefill_msisdn: z.boolean().optional().default(true),
});



export const encriptPayment = async (req:Request, res:Response) => {
    const accessKey = process.env.ACCESS_KEY
const IVKey = process.env.IV_KEY;
const secretKey = process.env.SECRET_KEY;
const algorithm = "aes-256-cbc";
const encryption = IVKey && secretKey ? new checkoutEncrypt.Encryption(IVKey, secretKey, algorithm) : null
    try {
      // Validate the input using Zod
      const payloadObj = apiSchema.parse(req.body);
  
      const payloadStr = JSON.stringify(payloadObj)
  console.log("IVKey:", IVKey , "secretKey:", secretKey)
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