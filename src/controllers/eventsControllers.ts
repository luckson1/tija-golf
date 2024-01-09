import { PrismaClient } from '@prisma/client';
import { z } from 'zod';
import  { Request, Response } from 'express';
import { addHours, parseISO, setHours, setMinutes, startOfDay } from 'date-fns';
import { getUser } from '../utils';
function combineDateAndTime(dateStr: string, timeStr: string): Date {
  let date = parseISO(dateStr); // Parse the date string
  date = startOfDay(date); // Reset time to 00:00:00

  // Extract hours and minutes from the time string
  const [time, modifier] = timeStr.split(' ');
  let [hours, minutes] = time.split(':').map((val) => parseInt(val, 10));

  // Convert 12-hour time to 24-hour time
  if (hours === 12) {
    hours = 0;
  }
  if (modifier.toUpperCase() === 'PM') {
    hours += 12;
  }

  date = setHours(date, hours);
  date = setMinutes(date, minutes);
  // adjust for EAC time
  date = addHours(date, -3);

  return date;
}

const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] [AP]M$/;

type EventData = z.infer<typeof EventSchema>;
const EventSchema = z.object({
  holes: z.enum(["9 holes", "18 holes"]),
  kit: z.enum(["Yes", "No"]),

  listedEventId: z.string().min(1, "Organization ID is required"),
  date: z.string().datetime(),
 startTime: z.string().regex(timeRegex, { message: "Invalid time format. Use HH:MM in 24-hour format." }),
 packageId: z.string()
});
const prisma = new PrismaClient();



export const createEvent = async (req:Request, res:Response) => {
  try {
    
    const token=req.headers.authorization;
    if(!token) return   res.status(403).send('Forbidden');
    const usersId=await getUser(token)
    if (!usersId)  return   res.status(401).send('Unauthorised');
    // Validate the input using Zod

    const {holes, kit, date, startTime, listedEventId, packageId} = EventSchema.parse(req.body);
    console.log(packageId)
const  startDate=combineDateAndTime(date, startTime)

    // Create the event in the database
    const newEvent = await prisma.event.create({
      data: {
        startDate,
        holes,
        kit,
        listedEventId,
        packageId

      },
    });

    const booking= await prisma.booking.create({
      data: {
        usersId,
        eventId: newEvent.id
      },
      select: {
        bookingRef:true,
        event: {
          include: {
            package: {
              select: {
                amount: true,
                name: true
              }
            }
          }
        }
        
      }
    })
    res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }



    // Handle other types of errors
    console.log(error)
    res.status(500).send(error);
  }
};


export const getAllEvents = async (req:Request, res:Response) => {
    try {
      // Fetch all event records from the database
      const events = await prisma.listedEvent.findMany({
        include: {
          // Include related bookings
        Package: {
          orderBy: {
            amount: "asc"
          }
        }
        
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
