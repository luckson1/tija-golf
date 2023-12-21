import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();


import  { Request, Response } from 'express';
type IdParams = {
    id?: string;
  };
  type TeeData = z.infer<typeof TeeSchema>;
const TeeSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  organizationId: z.string().min(1, "Organization ID is required"),
  startDate: z.date(),
  endDate: z.date(),
});

export const createTee = async (req:Request, res:Response) => {
  try {
    // Validate the input using Zod
    const parsedData = TeeSchema.parse(req.body);

    // Create the Tee in the database
    const newTee = await prisma.tee.create({
      data: {
        name: parsedData.name,
        description: parsedData.description,
        organizationId: parsedData.organizationId,
        startDate: parsedData.startDate,
        endDate: parsedData.endDate,
      },
    });

    // Send the created Tee as a response
    res.status(201).json(newTee);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    // Handle other types of errors
    res.status(500).send(error);
  }
};


export const getAllTees = async (req:Request, res:Response) => {
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

  export const getTee = async (req:Request, res:Response) => {
    try {
      // Extract the Tee ID from the request parameters
      const { id } = req.params;
      const parsedData = z.string().parse(id);
      // Fetch the Tee record from the database
      const tee = await prisma.tee.findUnique({
        where: { id:  parsedData  },
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
}



// Assuming you have a similar Zod schema for Tee updates
const TeeUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string(),
  organizationId: z.string(),
  startDate: z.date(),
  endDate: z.date(),
});

export const updateTee = async (req:Request, res:Response) => {
  try {
    const { id } = req.params;
    const parsedId = z.string().parse(id); // Get the Tee ID from the route parameter

    // Validate and parse the request data
    const updateData = TeeUpdateSchema.parse(req.body);

    // Update the Tee in the database
    const updatedTee = await prisma.tee.update({
      where: { id:  parsedId  },
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
