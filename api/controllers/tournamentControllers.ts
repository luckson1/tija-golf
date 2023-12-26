import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import  { Request, Response } from 'express';
const prisma = new PrismaClient();

const TournamentSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  organizationId: z.string().min(1, "Organization ID is required"),
  startDate: z.date(),
  endDate: z.date(),
});

export const createTournament = async (req:Request, res:Response) => {
  try {
    // Validate the input using Zod
    const parsedData = TournamentSchema.parse(req.body);

    // Create the tournament in the database
    const newTournament = await prisma.tournament.create({
      data: {
        name: parsedData.name,
        description: parsedData.description,
        organizationId: parsedData.organizationId,
        startDate: parsedData.startDate,
        endDate: parsedData.endDate,
      },
    });

    // Send the created tournament as a response
    res.status(201).json(newTournament);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    // Handle other types of errors
    res.status(500).send(error);
  }
};


export const getAllTournaments = async (req:Request, res:Response) => {
    try {
      // Fetch all tournament records from the database
      const tournaments = await prisma.tournament.findMany({
        include: {
          organisation: true, // Include related organization data
          bookings: true, // Include related bookings
          payments: true, // Include related payments
        },
      });
  
      // Send the retrieved tournaments as a response
      res.json(tournaments);
    } catch (error) {
      // Handle potential errors
      res.status(500).send(error);
    }
  };

  export const getTournament = async (req:Request, res:Response) => {
    try {
      // Extract the tournament ID from the request parameters
      const { id } = req.params;
      const parsedData = z.string().parse(id);
      // Fetch the tournament record from the database
      const tournament = await prisma.tournament.findUnique({
        where: { id:  parsedData  },
        include: {
          organisation: true, // Include related organization data
          bookings: true, // Include related bookings
          payments: true, // Include related payments
        },
      });
  
      if (tournament) {
        // Send the retrieved tournament as a response
        res.json(tournament);
      } else {
        // If no tournament is found, send a 404 response
        res.status(404).send("Tournament not found");
      }
    } catch (error) {
        if (error instanceof z.ZodError) {
            // If the error is a Zod validation error, send a bad request response
            return res.status(400).json(error.errors);
          }
      
      res.status(500).send(error);
    }
}




const TournamentUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  organizationId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const updateTournament = async (req:Request, res:Response) => {
  try {
    const { id } = req.params;
    const parsedId = z.string().parse(id); // Get the tournament ID from the route parameter

    // Validate and parse the request data
    const updateData = TournamentUpdateSchema.parse(req.body);

    // Update the tournament in the database
    const updatedTournament = await prisma.tournament.update({
      where: { id:  parsedId  },
      data: updateData,
    });

    // Send the updated tournament as a response
    res.json(updatedTournament);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    } 

    // Handle other types of errors
    res.status(500).send(error);
  }
};
