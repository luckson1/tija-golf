import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import  { Request, Response } from 'express';
const prisma = new PrismaClient();

const partnerSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
image : z.string(),
email : z.string().email(),
phone : z.string(),
location : z.string(),
website : z.string().url(),

 
});

export const createPartner = async (req:Request, res:Response) => {
  try {
    // Validate the input using Zod
    const data = partnerSchema.parse(req.body);

    // Create the partner in the database
    const newpartner = await prisma.partner.create({
      data: {
       
  ...data
      },
    });

    // Send the created partner as a response
    res.status(201).json(newpartner);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    // Handle other types of errors
    res.status(500).send(error);
  }
};


export const getAllPartners = async (req:Request, res:Response) => {
    try {
      // Fetch all partner records from the database
      const partners = await prisma.partner.findMany();
  
      // Send the retrieved partners as a response
      res.json(partners);
    } catch (error) {
      console.log(error)
      // Handle potential errors
      res.status(500).send(error);
    }
  };

  export const getPartner = async (req:Request, res:Response) => {
    try {
      // Extract the partner ID from the request parameters
      const { id } = req.params;
      const parsedData = z.string().parse(id);
      // Fetch the partner record from the database
      const partner = await prisma.partner.findUnique({
        where: { id:  parsedData  },
      
      });
  
      if (partner) {
        // Send the retrieved partner as a response
        res.json(partner);
      } else {
        // If no partner is found, send a 404 response
        res.status(404).send("partner not found");
      }
    } catch (error) {
        if (error instanceof z.ZodError) {
            // If the error is a Zod validation error, send a bad request response
            return res.status(400).json(error.errors);
          }
      
      res.status(500).send(error);
    }
}





export const updatePartner = async (req:Request, res:Response) => {
  try {
    const { id } = req.params;
    const parsedId = z.string().parse(id); // Get the partner ID from the route parameter

    // Validate and parse the request data
    const updateData = partnerSchema.parse(req.body);

    // Update the partner in the database
    const updatedpartner = await prisma.partner.update({
      where: { id:  parsedId  },
      data: updateData,
    });

    // Send the updated partner as a response
    res.json(updatedpartner);
  } catch (error) {
    console.log(error)
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    } 

    // Handle other types of errors
    res.status(500).send(error);
  }
};
