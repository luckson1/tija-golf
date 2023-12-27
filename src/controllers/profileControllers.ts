import { z } from 'zod';



export type ProfileInput = z.infer<typeof profileSchema>;
import { PrismaClient } from '@prisma/client';
import { Request, Response } from 'express';
import { getUser } from '../utils';

export const profileSchema = z.object({
  name: z.string(),
  email: z.string().email(),
  phoneNumber: z.string(),
  gender: z.enum(['male', 'female']),
  dateOfBirth: z.date(),
  cohort: z.number(),
});

const prisma = new PrismaClient();

export const createProfile = async (req: Request, res: Response) => {
  try {
    const token=req.headers.authorization;
  
    if(!token) return   res.status(403).send('Forbidden');
    const usersId=await getUser(token)
    if (!usersId)  return   res.status(401).send('Unauthorised');
    const body = profileSchema.parse(req.body);
    const data= {...body, usersId}
console.log(data)
    const profile = await prisma.profile.create({ data });

    res.status(201).json({ message: 'Profile created successfully', profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
        // If the error is a Zod validation error, send a bad request response
        return res.status(400).json({message: "validation errors",  errors:error.errors});
      }
    res.status(500).json({ message: 'Error creating profile', error });
  }
};

export const fetchProfile = async (req: Request, res: Response) => {
  try {
    const token=req.headers.authorization;
    if(!token) return   res.status(403).send('Forbidden');
    const usersId=await getUser(token)
    if (!usersId)  return   res.status(401).send('Unauthorised');



    const profile = await prisma.profile.findUnique({
      where: {
        usersId
      }
    });

    res.status(201).json({ profile });
  } catch (error) {
    
    res.status(500).json({ message: 'Error creating profile', error });
  }
};






// ... existing createProfile function ...

export const editProfile = async (req: Request, res: Response) => {
  const { id } = req.params;
  try {
    const data = profileSchema.parse(req.body);

    const profile = await prisma.profile.update({
      where: { id },
      data,
    });

    res.status(200).json({ message: 'Profile updated successfully', profile });
  } catch (error) {
    if (error instanceof z.ZodError) {
        // If the error is a Zod validation error, send a bad request response
        return res.status(400).json(error.errors);
      }
    res.status(500).json({ message: 'Error updating profile', error });
  }
};
export const testProfile = async (req: Request, res: Response) => {
console.log("Testing")
res.send("Hi there, nice testing!!")
};

