import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Request, Response } from "express";
import { getUser } from "../utils";
import { parseISO, setHours, setMinutes, startOfDay, addHours } from "date-fns";

const prisma = new PrismaClient();
const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] [AP]M$/;
function combineDateAndTime(dateStr: string, timeStr: string): Date {
  let date = parseISO(dateStr); // Parse the date string
  date = startOfDay(date); // Reset time to 00:00:00

  // Extract hours and minutes from the time string
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map((val) => parseInt(val, 10));

  // Convert 12-hour time to 24-hour time
  if (hours === 12) {
    hours = 0;
  }
  if (modifier.toUpperCase() === "PM") {
    hours += 12;
  }

  date = setHours(date, hours);
  date = setMinutes(date, minutes);
  // adjust for EAC time
  date = addHours(date, -3);

  return date;
}

type IdParams = {
  id?: string;
};
type TeeData = z.infer<typeof TeeSchema>;
const TeeSchema = z.object({
  holes: z.enum(["9 holes", "18 holes"]),
  kit: z.enum(["Yes", "No"]),

  organizationId: z.string().min(1, "Organization ID is required"),
  date: z.string().datetime(),
  startTime: z.string().regex(timeRegex, {
    message: "Invalid time format. Use HH:MM in 24-hour format.",
  }),
});

const CreatePaymentSchema = z.object({
  bookingId: z.string(),
  usersId: z.string(),
  amount: z.number(),
  teeId: z.string(),
  organizationId: z.string(),
});

// Use this schema to validate data when creating a payment

export const createTee = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");
    // Validate the input using Zod

    const parsedData = TeeSchema.parse(req.body);
    const startDate = combineDateAndTime(parsedData.date, parsedData.startTime);

    console.log(parsedData.date);
    const { holes, kit, organizationId } = parsedData;
    // Create the Tee in the database
    const newTee = await prisma.tee.create({
      data: {
        holes,
        kit,
        organizationId,
        startDate,
      },
    });

    const booking = await prisma.booking.create({
      data: {
        usersId,
        teeId: newTee.id,
      },
      include: {
        tee: true,
      },
    });
    const kitCost = kit
      ? await prisma.kitPrices.findFirst({
          where: {
            organizationId,
          },
          select: {
            amount: true,
          },
        })
      : null;
    const gameCost =
      holes === "9 holes"
        ? await prisma.holesPrices.findFirst({
            where: {
              organizationId,
              numberOfHoles: "Nine",
            },
            select: { amount: true },
          })
        : await prisma.holesPrices.findFirst({
            where: {
              organizationId,
              numberOfHoles: "Eighteen",
            },
            select: { amount: true },
          });
    const amount = (kitCost?.amount ?? 0) + (gameCost?.amount ?? 0);
    res.status(201).json({...booking, amount});
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(error.errors.at(0)?.message);
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors.at(0)?.message);
    }

    // Handle other types of errors
    console.log(error);
    res.status(500).send(error);
  }
};

export const getAllTees = async (req: Request, res: Response) => {
  try {
    // Fetch all Tee records from the database
    const Tees = await prisma.tee.findMany({
      include: {
        organisation: true, // Include related organization data
        bookings: true, // Include related bookings
        payments: true, // Include related payments
      },
    });

    // Send the retrieved Tees as a response
    res.json(Tees);
  } catch (error) {
    // Handle potential errors
    res.status(500).send(error);
  }
};

export const getTee = async (req: Request, res: Response) => {
  try {
    // Extract the Tee ID from the request parameters
    const { id } = req.params;
    const parsedData = z.string().parse(id);
    // Fetch the Tee record from the database
    const tee = await prisma.tee.findUnique({
      where: { id: parsedData },
      include: {
        organisation: true, // Include related organization data
        bookings: true, // Include related bookings
        payments: true, // Include related payments
      },
    });

    if (tee) {
      // Send the retrieved Tee as a response
      res.json(tee);
    } else {
      // If no Tee is found, send a 404 response
      res.status(404).send("Tee not found");
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    res.status(500).send(error);
  }
};

// Assuming you have a similar Zod schema for Tee updates
const TeeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string(),
  organizationId: z.string(),
  startDate: z.string().datetime(),
  endDate: z.date(),
});

export const updateTee = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const parsedId = z.string().parse(id); // Get the Tee ID from the route parameter

    // Validate and parse the request data
    const updateData = TeeUpdateSchema.parse(req.body);

    // Update the Tee in the database
    const updatedTee = await prisma.tee.update({
      where: { id: parsedId },
      data: updateData,
    });

    // Send the updated Tee as a response
    res.json(updatedTee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    // Handle other types of errors
    res.status(500).send(error);
  }
};

// Express route handler
export const createPayment = async (req: Request, res: Response) => {
  try {
    // Validate the request body using the Zod schema
    const parsedData = CreatePaymentSchema.parse(req.body);

    // Use the parsed data to create a new payment in the database
    const payment = await prisma.payment.create({
      data: {
        bookingId: parsedData.bookingId,
        usersId: parsedData.usersId,
        amount: parsedData.amount,
        organizationId: parsedData.organizationId,
        // Optional fields are included conditionally
        ...(parsedData.teeId && { teeId: parsedData.teeId }),
      },
    });

    // Send back the created payment data
    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      res.status(400).json({ errors: error.issues });
    } else {
      // Handle other types of errors
      console.error("Unexpected Error:", error);
      res.status(500).send("An unexpected error occurred");
    }
  }
};
