import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
import  { Request, Response } from 'express';
type IdParams = {
    id?: string;
  };
  type EventData = z.infer<typeof EventSchema>;
const EventSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  organizationId: z.string().min(1, "Organization ID is required"),
  startDate: z.date(),
  endDate: z.date(),
});

export const createEvent = async (req:Request, res:Response) => {
  try {
    // Validate the input using Zod
    const parsedData = EventSchema.parse(req.body);

    // Create the event in the database
    const newEvent = await prisma.event.create({
      data: {
        name: parsedData.name,
        description: parsedData.description,
        organizationId: parsedData.organizationId,
        startDate: parsedData.startDate,
        endDate: parsedData.endDate,
      },
    });

    // Send the created event as a response
    res.status(201).json(newEvent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    // Handle other types of errors
    res.status(500).send(error);
  }
};


export const getAllEvents = async (req:Request, res:Response) => {
    try {
      // Fetch all event records from the database
      const events = await prisma.event.findMany({
        include: {
          organisation: true, // Include related organization data
          bookings: true, // Include related bookings
          payments: true, // Include related payments
        },
      });
  
      // Send the retrieved events as a response
      res.json(events);
    } catch (error) {
      // Handle potential errors
      res.status(500).send(error);
    }
  };

  export const getEvent = async (req:Request, res:Response) => {
    try {
      // Extract the event ID from the request parameters
      const { id } = req.params;
      const parsedData = z.string().parse(id);
      // Fetch the event record from the database
      const event = await prisma.event.findUnique({
        where: { id:  parsedData  },
        include: {
          organisation: true, // Include related organization data
          bookings: true, // Include related bookings
          payments: true, // Include related payments
        },
      });
  
      if (event) {
        // Send the retrieved event as a response
        res.json(event);
      } else {
        // If no event is found, send a 404 response
        res.status(404).send("event not found");
      }
    } catch (error) {
        if (error instanceof z.ZodError) {
            // If the error is a Zod validation error, send a bad request response
            return res.status(400).json(error.errors);
          }
      
      res.status(500).send(error);
    }
}



// Assuming you have a similar Zod schema for event updates
const eventUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  organizationId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const updateEvent = async (req:Request, res:Response) => {
  try {
    const { id } = req.params;
    const parsedId = z.string().parse(id); // Get the event ID from the route parameter

    // Validate and parse the request data
    const updateData = eventUpdateSchema.parse(req.body);

    // Update the event in the database
    const updatedevent = await prisma.event.update({
      where: { id:  parsedId  },
      data: updateData,
    });

    // Send the updated event as a response
    res.json(updatedevent);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    } 

    // Handle other types of errors
    res.status(500).send(error);
  }
};
