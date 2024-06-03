import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Request, Response } from "express";
import { addHours, parseISO, setHours, setMinutes, startOfDay } from "date-fns";
import { getUser } from "../utils";

function combineDateAndTime(dateStr: string, timeStr: string): Date {
  let date = parseISO(dateStr); // Parse the date string
  date = startOfDay(date); // Reset time to 00:00:00

  // Extract hours and minutes from the time string
  const [time, modifier] = timeStr.split(" ");
  let [hours, minutes] = time.split(":").map((val) => parseInt(val, 10));

  // Convert 12-hour time to 24-hour time
  if (hours === 12) {
    hours = 0;
  }
  if (modifier === "pm") {
    hours += 12;
  }

  date = setHours(date, hours);
  date = setMinutes(date, minutes);
  // adjust for EAC time
  date = addHours(date, -3);

  return date;
}

const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] [ap]m$/;

type EventData = z.infer<typeof EventSchema>;
const EventSchema = z.object({
  holes: z.enum(["9 holes", "18 holes"]),
  kit: z.enum(["Yes", "No"]),

  listedEventId: z.string().min(1, "Organization ID is required"),
  date: z.string().datetime(),
  startTime: z.string().regex(timeRegex, {
    message: "Invalid time format. Use HH:MM in 24-hour format.",
  }),
  packageId: z.string(),
});
const prisma = new PrismaClient();

/**
 * @swagger
 * /api/events:
 *   post:
 *     summary: Book a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               holes:
 *                 type: string
 *                 enum: ["9 holes", "18 holes"]
 *                 description: Number of holes
 *               kit:
 *                 type: string
 *                 enum: ["Yes", "No"]
 *                 description: Whether kit is included
 *               listedEventId:
 *                 type: string
 *                 description: The ID of the listed event
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The date of the event
 *               startTime:
 *                 type: string
 *                 description: The start time of the event
 *               packageId:
 *                 type: string
 *                 description: The ID of the package
 *     responses:
 *       201:
 *         description: Event created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedBooking:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     slug:
 *                       type: string
 *                     event:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         package:
 *                           type: object
 *                           properties:
 *                             amount:
 *                               type: number
 *                             name:
 *                               type: string
 *                 amount:
 *                   type: number
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const createEvent = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");
    // Validate the input using Zod

    const { holes, kit, date, startTime, listedEventId, packageId } =
      EventSchema.parse(req.body);

    const startDate = combineDateAndTime(date, startTime);

    // Use a transaction to perform the following operations atomically
    const result = await prisma.$transaction(async (prisma) => {
      // Create the event in the database
      const newEvent = await prisma.event.create({
        data: {
          startDate,
          holes,
          kit,
          listedEventId,
          packageId,
        },
      });

      // Create the booking for the event
      const booking = await prisma.booking.create({
        data: {
          usersId,
          eventId: newEvent.id,
        },
      });
      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          slug: `E-${booking?.bookingRef}`,
        },
        include: {
          event: {
            include: {
              package: {
                select: {
                  amount: true,
                  name: true,
                },
              },
            },
          },
        },
      });

      // Calculate the kit cost if applicable
      const kitCost =
        kit === "Yes"
          ? await prisma.kitPrices.findFirst({
              where: {
                listedEventId,
              },
              select: {
                amount: true,
              },
            })
          : null;

      // Calculate the total amount
      const amount = kitCost
        ? Number(updatedBooking.event?.package.amount) + kitCost.amount
        : Number(updatedBooking.event?.package.amount);
      console.log(amount);
      return { updatedBooking, amount };
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    // Handle other types of errors
    console.log(error);
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/events:
 *   get:
 *     summary: Retrieve a list of all upcoming events
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of upcoming events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   location:
 *                     type: string
 *                   description:
 *                     type: string
 *                   image:
 *                     type: string
 *                   startDate:
 *                     type: string
 *                     format: date-time
 *                   type:
 *                     type: string
 *                   PackageGroup:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         name:
 *                           type: string
 *                         packages:
 *                           type: array
 *                           items:
 *                             type: object
 *                             properties:
 *                               id:
 *                                 type: string
 *                               price:
 *                                 type: number
 *                               name:
 *                                 type: string
 *                   Package:
 *                     type: array
 *                     items:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         price:
 *                           type: number
 *                         name:
 *                           type: string
 *       500:
 *         description: Internal server error
 */
export const getAllEvents = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    // Fetch all event records from the database
    const events = await prisma.listedEvent.findMany({
      where: {
        startDate: {
          gt: new Date(),
          // Only get events where the start date is greater than the current date and time
        },
      },
      include: {
        PackageGroup: {
          include: {
            packages: {
              orderBy: {
                price: "asc",
              },
            },
          },
        },
        Package: {
          orderBy: {
            price: "asc",
          },
        },
      },
      orderBy: {
        startDate: "desc",
      },
    });

    // Send the retrieved events as a response
    res.json(events);
  } catch (error) {
    console.log(error);
    // Handle potential errors
    res.status(500).send(error);
  }
};

export const getEvent = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    // Extract the event ID from the request parameters
    const { id } = req.params;
    const parsedData = z.string().parse(id);
    // Fetch the event record from the database
    const event = await prisma.event.findUnique({
      where: { id: parsedData },
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
};

// Assuming you have a similar Zod schema for event updates
const eventUpdateSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().optional(),
  organizationId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

/**
 * @swagger
 * /api/events/{id}:
 *   put:
 *     summary: Update an existing event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         schema:
 *           type: string
 *         required: true
 *         description: The ID of the event to update
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               holes:
 *                 type: string
 *                 enum: ["9 holes", "18 holes"]
 *                 description: Number of holes
 *               kit:
 *                 type: string
 *                 enum: ["Yes", "No"]
 *                 description: Whether kit is included
 *               listedEventId:
 *                 type: string
 *                 description: The ID of the listed event
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The date of the event
 *               startTime:
 *                 type: string
 *                 description: The start time of the event
 *               packageId:
 *                 type: string
 *                 description: The ID of the package
 *     responses:
 *       200:
 *         description: Event updated successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 updatedEvent:
 *                   type: object
 *                   properties:
 *                     id:
 *                       type: string
 *                     startDate:
 *                       type: string
 *                       format: date-time
 *                     holes:
 *                       type: string
 *                     kit:
 *                       type: string
 *                     listedEventId:
 *                       type: string
 *                     packageId:
 *                       type: string
 *                     package:
 *                       type: object
 *                       properties:
 *                         amount:
 *                           type: string
 *                 amount:
 *                   type: number
 *       400:
 *         description: Bad request
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */

export const updateEvent = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const { id } = req.params;
    const parsedId = z.string().parse(id); // Get the event ID from the route parameter

    const { holes, kit, date, startTime, listedEventId, packageId } =
      EventSchema.parse(req.body);

    const startDate = combineDateAndTime(date, startTime);

    // Update the event in the database using a transaction
    const result = await prisma.$transaction(async (prisma) => {
      // Update the event
      const updatedEvent = await prisma.event.update({
        where: { id: parsedId },
        data: {
          startDate,
          holes,
          kit,
          listedEventId,
          packageId,
        },
        include: {
          package: true,
        },
      });

      // If kit is provided and is "Yes", calculate the new kit cost
      let kitCost = null;
      if (kit && kit === "Yes") {
        kitCost = await prisma.kitPrices.findFirst({
          where: {
            listedEventId: updatedEvent.listedEventId,
          },
          select: {
            amount: true,
          },
        });
      }

      // Calculate the total amount if kit cost is applicable
      let amount;
      if (kitCost) {
        amount = Number(updatedEvent.package.amount) + kitCost.amount;
      } else {
        amount = Number(updatedEvent.package.amount);
      }

      // Return the updated event and the new amount
      return { updatedEvent, amount };
    });

    // Send the updated event and amount as a response
    res.json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }
    console.log(error);
    // Handle other types of errors
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/events/list:
 *   post:
 *     summary: List a new event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the event
 *               location:
 *                 type: string
 *                 description: The location of the event
 *               description:
 *                 type: string
 *                 description: The description of the event
 *               image:
 *                 type: string
 *                 description: The image URL of the event
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: The start date of the event
 *               type:
 *                 type: string
 *                 description: The type of the event
 *               holesPrices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     numberOfHoles:
 *                       type: string
 *                       enum: ["Nine", "Eighteen"]
 *                       description: The number of holes
 *                     amount:
 *                       type: number
 *                       description: The price for the holes
 *               kitPrice:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                     description: The price for the kit
 *     responses:
 *       201:
 *         description: Event listed successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   $ref: '#/components/schemas/ListedEvent'
 *       400:
 *         description: Bad request
 *       500:
 *         description: Internal server error
 */

const ListEventSchema = z.object({
  name: z.string().min(1, "Name is required"),
  location: z.string().min(1, "Location is required"),
  description: z.string(),
  image: z.string().url().optional(),
  startDate: z.string().optional(),
  type: z.string().min(1, "Type is required"),
  holesPrices: z.array(
    z.object({
      numberOfHoles: z.enum(["Nine", "Eighteen"]),
      amount: z.number().positive(),
    })
  ),
  kitPrice: z.object({
    amount: z.number().positive(),
  }),
});

export const listEvent = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    // Validate the request body
    const validatedData = ListEventSchema.parse(req.body);

    const {
      name,
      location,
      description,
      image,
      startDate,
      type,
      holesPrices,
      kitPrice,
    } = validatedData;

    // Use a transaction for all the database ops below
    const newEvent = await prisma.$transaction(async (prisma) => {
      const createdEvent = await prisma.listedEvent.create({
        data: {
          name,
          location,
          description,
          image,
          startDate: startDate ? new Date(startDate) : undefined,
          type,
        },
      });

      // Create related HolesPrices
      for (const holesPrice of holesPrices) {
        await prisma.holesPrices.create({
          data: {
            listedEventId: createdEvent.id,
            numberOfHoles: holesPrice.numberOfHoles,
            amount: holesPrice.amount,
          },
        });
      }

      // Create related KitPrice
      await prisma.kitPrices.create({
        data: {
          listedEventId: createdEvent.id,
          amount: kitPrice.amount,
        },
      });

      return createdEvent;
    });

    // Return the new event
    res.status(201).json({ event: newEvent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }
    console.error("Error listing event:", error);
    res.status(500).send("An error occurred while listing the event");
  } finally {
    await prisma.$disconnect();
  }
};

/**
 * @swagger
 * /api/events/edit/list:
 *   put:
 *     summary: Edit an existing event
 *     tags: [Events]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               id:
 *                 type: string
 *                 description: The ID of the event to edit
 *               name:
 *                 type: string
 *                 description: The name of the event
 *               location:
 *                 type: string
 *                 description: The location of the event
 *               description:
 *                 type: string
 *                 description: The description of the event
 *               image:
 *                 type: string
 *                 description: The image URL of the event
 *               startDate:
 *                 type: string
 *                 format: date-time
 *                 description: The start date of the event
 *               type:
 *                 type: string
 *                 description: The type of the event
 *               holesPrices:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     numberOfHoles:
 *                       type: string
 *                       enum: ["Nine", "Eighteen"]
 *                       description: The number of holes
 *                     amount:
 *                       type: number
 *                       description: The price for the holes
 *               kitPrice:
 *                 type: object
 *                 properties:
 *                   amount:
 *                     type: number
 *                     description: The price for the kit
 *     responses:
 *       200:
 *         description: Event edited successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 event:
 *                   $ref: '#/components/schemas/ListedEvent'
 *       400:
 *         description: Bad request
 *       404:
 *         description: Event not found
 *       500:
 *         description: Internal server error
 */

const EditEventSchema = z.object({
  id: z.string().min(1, "ID is required"),
  name: z.string().min(1, "Name is required").optional(),
  location: z.string().min(1, "Location is required").optional(),
  description: z.string().optional(),
  image: z.string().url().optional(),
  startDate: z.string().optional(),
  type: z.string().min(1, "Type is required").optional(),
  holesPrices: z
    .array(
      z.object({
        numberOfHoles: z.enum(["Nine", "Eighteen"]),
        amount: z.number().positive(),
      })
    )
    .optional(),
  kitPrice: z
    .object({
      amount: z.number().positive(),
    })
    .optional(),
});

export const editListedEvent = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    // Validate the request body
    const validatedData = EditEventSchema.parse(req.body);

    const {
      id,
      name,
      location,
      description,
      image,
      startDate,
      type,
      holesPrices,
      kitPrice,
    } = validatedData;

    // Use a transaction for all the database ops below
    const updatedEvent = await prisma.$transaction(async (prisma) => {
      const event = await prisma.listedEvent.update({
        where: { id },
        data: {
          name,
          location,
          description,
          image,
          startDate: startDate ? new Date(startDate) : undefined,
          type,
        },
      });

      if (holesPrices) {
        // Delete existing HolesPrices
        await prisma.holesPrices.deleteMany({
          where: { listedEventId: id },
        });

        // Create new HolesPrices
        for (const holesPrice of holesPrices) {
          await prisma.holesPrices.create({
            data: {
              listedEventId: id,
              numberOfHoles: holesPrice.numberOfHoles,
              amount: holesPrice.amount,
            },
          });
        }
      }

      if (kitPrice) {
        // Update KitPrice
        await prisma.kitPrices.updateMany({
          where: { listedEventId: id },
          data: {
            amount: kitPrice.amount,
          },
        });
      }

      return event;
    });

    // Return the updated event
    res.status(200).json({ event: updatedEvent });
  } catch (error) {
    if (error instanceof z.ZodError) {
      // If the error is a Zod validation error, send a bad request response
      return res.status(400).json(error.errors);
    }

    console.error("Error editing event:", error);
    res.status(500).send("An error occurred while editing the event");
  } finally {
    await prisma.$disconnect();
  }
};
