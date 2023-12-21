import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import  { Request, Response } from 'express';
import { getUser, supabaseClient } from 'utils';
type IdParams = {
    id?: string;
  };
const prisma = new PrismaClient();

const BookingSchema = z.object({
    sessionId: z.string().optional(),
    eventId: z.string().optional(),
    classId: z.string().optional(),
    tournamentId: z.string().optional(),
    bookingDate: z.date()
  });
  type BookingData = z.infer<typeof BookingSchema>;
  export const createBooking = async (req: Request, res: Response) => {

    try {
      const usersId=await getUser()
      if (!usersId)  return   res.status(401).send('Unauthorised');
        const data = BookingSchema.parse(req.body);
      const booking = await prisma.booking.create({
     data: {
      ...data,
      usersId
     }
      });
      res.status(201).json(booking);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json(error.errors);
          } 
      res.status(500).send(error);
    }
  };
  

  export const getAllBookings = async (req:Request, res:Response) => {
    try {
      const bookings = await prisma.booking.findMany();
      res.json(bookings);
    } catch (error) {
      res.status(500).send(error);
    }
  };

  
  export const getBooking = async (req:Request, res:Response) => {
    try {
      const booking = await prisma.booking.findUnique({
        where: { id: req.params.id },
      });
      if (booking) {
        res.json(booking);
      } else {
        res.status(404).send('Booking not found');
      }
    } catch (error) {
      res.status(500).send(error);
    }
  };
  
  export const updateBooking = async (req: Request<IdParams, {}, BookingData>, res: Response) => {
    try {
        const data = BookingSchema.parse(req.body);
        const id=z.string().parse(req.params?.id)
        const usersId=await getUser()
        if (!usersId)  return   res.status(401).send('Unauthorised');
      const booking = await prisma.booking.update({
        where: { id, usersId},
        data
      });
      res.json(booking);
    } catch (error) {
        if (error instanceof z.ZodError) {
            return res.status(400).json(error.errors);
          }
      res.status(500).send(error);
    }
  };
  