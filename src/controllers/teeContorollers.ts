import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Request, Response } from "express";
import { getUser } from "../utils";

const prisma = new PrismaClient();
const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] [AP]M$/;
function combineDateAndTime(data: TeeData): Date {
  // Extract the date and time
  const { date, startTime } = data;

  // Convert 12-hour format time to 24-hour format
  const [time, modifier] = startTime.split(' ');
  let [hours, minutes] = time? time?.split(':') : [undefined, undefined];
  if (hours === '12') {
    hours = '00';
  }
  if (modifier === 'PM' && hours) {
    hours = (parseInt(hours, 10) + 12).toString();
  }

  // Combine the date and time
  const combinedDate = new Date(date);
  combinedDate.setHours(parseInt(hours ?? "09", 10), parseInt(minutes ?? "00", 10));

  return combinedDate;
}


type IdParams = {
  id?: string;
};
type TeeData = z.infer<typeof TeeSchema>;
const TeeSchema = z.object({
  holes: z.enum(["9 holes", "18 holes"]),
  kit: z.enum(["Yes", "No"]),
  isExistingGame: z.enum(["Yes", "No"]),

  organizationId: z.string().min(1, "Organization ID is required"),
  date: z.date(),
 startTime: z.string().regex(timeRegex, { message: "Invalid time format. Use HH:MM in 24-hour format." }),
});

export const createTee = async (req: Request, res: Response) => {
  try {
    const token=req.headers.authorization;
    if(!token) return   res.status(403).send('Forbidden');
    const usersId=await getUser(token)
    if (!usersId)  return   res.status(401).send('Unauthorised');
    // Validate the input using Zod
    const parsedData = TeeSchema.parse(req.body);
const  startDate=combineDateAndTime(parsedData)
    // Create the Tee in the database
    const newTee = await prisma.tee.create({
      data: {
        ...parsedData,
        startDate
      },
    });

const booking= await prisma.booking.create({
  data: {
    usersId,
    teeId: newTee.id
  },
  include: {
    tee: true
  }
})
    res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      console.log(error.errors.at(0)?.message)
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors.at(0)?.message);
    }

    // Handle other types of errors
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
  startDate: z.date(),
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
