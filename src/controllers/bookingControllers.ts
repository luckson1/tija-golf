
import { z } from 'zod';
import  { Request, Response } from 'express';
import { getUser } from '../utils';
import { PrismaClient } from '@prisma/client';
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
      const token=req.headers.authorization;
      if(!token) return   res.status(403).send('Forbidden');
      const usersId=await getUser(token)
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
        where: { bookingRef: Number(req.params.id) },
        select: {
          status: true
        }
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
        const token=req.headers.authorization;
        if(!token) return   res.status(403).send('Forbidden');
        const usersId=await getUser(token)
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
  
 export async function getUpcomingActivities (req:Request, res:Response) {
    // Get current date
    const currentDate = new Date();
  try {
    const token=req.headers.authorization;
    if(!token) return   res.status(403).send('Forbidden');
    const usersId=await getUser(token)
    if (!usersId)  return   res.status(401).send('Unauthorised');
    // Fetch upcoming bookings for the user, including the event, class, or tournament details
    const bookings = await prisma.booking.findMany({
      where: {
        usersId: usersId,
        OR: [
          {
            event: {
              startDate: {
                gt: currentDate,
              },
            },
          },
          {
            class: {
              startDate: {
                gt: currentDate,
              },
            },
          },
          {
            tournament: {
              startDate: {
                gt: currentDate,
              },
            },
          },
        ],
      },
      include: {
        event:true,
        class: {
          include: {
            organisation: true
          }
        },
        tournament: {
          include: {
            organisation: true
          }
        },
        tee: {
          include: {
            organisation: true
          }
        },
        
        
      },
    });
  
    // Extract the activities from the bookings
    const activities = bookings.map(booking => {
      return {
        ...booking.event,
        ...booking.class,
        ...booking.tournament,
        ...booking.tee,
        bookingDate: booking.bookingDate,
      };
    }).filter(activity => activity.startDate); // Filter out undefined results
  
    // Sort by startDate
    activities.sort((a, b) => a?.startDate?.getTime()!- b?.startDate?.getTime()!);
  
    return activities;
  } catch (error) {
    
  }
  }
  export async function getTeeBookings(req:Request, res:Response) {
  
  try {
    const token=req.headers.authorization;
    if(!token) return   res.status(403).send('Forbidden');
    const usersId=await getUser(token)
    if (!usersId)  return   res.status(401).send('Unauthorised');
    // Fetch upcoming bookings for the user, including the event, class, or tournament details
    const bookings = await prisma.booking.findMany({
      where: {
        usersId: usersId,
        teeId: {
          not: null,
        },
      },
      
      select: {
        status: true,
        id: true,
        bookingRef: true,
        tee: {
          include: {
            organisation: true
          }
        },
        
        
      },
      orderBy: {
        tee: {
          startDate: 'asc', // Order by tee startDate in ascending order
        },
      },
    });

    res.json(bookings)
   
  } catch (error) {
    res.status(500).send(error);
  }
  }

  export async function getEventBookings(req:Request, res:Response) {
  
    try {
      const token=req.headers.authorization;
      if(!token) return   res.status(403).send('Forbidden');
      const usersId=await getUser(token)
      if (!usersId)  return   res.status(401).send('Unauthorised');
      // Fetch upcoming bookings for the user, including the event, class, or tournament details
      const bookings = await prisma.booking.findMany({
        where: {
          usersId: usersId,
          eventId: {
            not: null,
          },
        },
        
        select: {
          status: true,
          id: true,
          bookingRef: true,
          event: {
            select: {
        id: true,
        startDate: true,
      holes: true,
    kit: true,

package: {
  select: {
    amount: true,
    name: true
  }
},
              ListedEvent: {
                select: {
                  name: true,
                  location: true,
                  image: true,
                  type: true
                  
                }
              }
            }
          },
          
          
        },
        orderBy: {
          event: {
            startDate: 'asc', // Order by tee startDate in ascending order
          },
        },
      });
  
      res.json(bookings)
     
    } catch (error) {
      res.status(500).send(error);
    }
    }