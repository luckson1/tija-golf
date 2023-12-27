import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();
import  { Request, Response } from 'express';
type IdParams = {
    id?: string;
  };
  type ClassData = z.infer<typeof ClassSchema>;
const ClassSchema = z.object({
  name: z.string().min(1, "Name is required"),
  description: z.string(),
  organizationId: z.string().min(1, "Organization ID is required"),
  startDate: z.date(),
  endDate: z.date(),
  cohort:z.number()
});

export const createClass = async (req: Request<{}, {},ClassData>, res: Response) => {
  try {
    // Validate the input using Zod
    const parsedData = ClassSchema.parse(req.body);

    // Create the class in the database
    const newclass = await prisma.class.create({
      data: {
        cohort: parsedData.cohort,
        description: parsedData.description,
        organizationId: parsedData.organizationId,
        startDate: parsedData.startDate,
        endDate: parsedData.endDate,
      },
    });

    // Send the created class as a response
    res.status(201).json(newclass);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    // Handle other types of errors
    res.status(500).send(error);
  }
};


export const getAllClasses = async (req:Request, res:Response) => {
    try {
      // Fetch all class records from the database
      const classes = await prisma.class.findMany({
        include: {
          organisation: true, // Include related organization data
          bookings: true, // Include related bookings
          payments: true, // Include related payments
        },
      });
  
      // Send the retrieved classs as a response
      res.json(classes);
    } catch (error) {
      // Handle potential errors
      res.status(500).send(error);
    }
  };

  export const getClass = async (req:Request, res:Response) => {
    try {
      // Extract the class ID from the request parameters
      const { id } = req.params;
      const parsedData = z.string().parse(id);
      // Fetch the class record from the database
      const c = await prisma.class.findUnique({
        where: { id:  parsedData  },
        include: {
          organisation: true, // Include related organization data
          bookings: true, // Include related bookings
          payments: true, // Include related payments
        },
      });
  
      if (c) {
        // Send the retrieved class as a response
        res.json(c);
      } else {
        // If no class is found, send a 404 response
        res.status(404).send("class not found");
      }
    } catch (error) {
        if (error instanceof z.ZodError) {
            // If the error is a Zod validation error, send a bad request response
            return res.status(400).json(error.errors);
          }
      
      res.status(500).send(error);
    }
}



// Assuming you have a similar Zod schema for class updates
const classUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  organizationId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export const updateClass = async (req:Request, res:Response) => {
  try {
    const { id } = req.params;
    const parsedId = z.string().parse(id); // Get the class ID from the route parameter

    // Validate and parse the request data
    const updateData = classUpdateSchema.parse(req.body);

    // Update the class in the database
    const updatedclass = await prisma.class.update({
      where: { id:  parsedId  },
      data: updateData,
    });

    // Send the updated class as a response
    res.json(updatedclass);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    } 

    // Handle other types of errors
    res.status(500).send(error);
  }
};
