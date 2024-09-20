import { z } from "zod";
import { Request, Response } from "express";
import { getUser } from "../utils";
import { PrismaClient } from "@prisma/client";
type IdParams = {
  id?: string;
};
const prisma = new PrismaClient();

const BookingSchema = z.object({
  sessionId: z.string().optional(),
  eventId: z.string().optional(),
  classId: z.string().optional(),
  tournamentId: z.string().optional(),
  bookingDate: z.date(),
});
type BookingData = z.infer<typeof BookingSchema>;

/**
 * @swagger
 * /api/bookings:
 *   post:
 *     summary: Create a new booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               eventId:
 *                 type: string
 *                 description: The ID of the event
 *               classId:
 *                 type: string
 *                 description: The ID of the class
 *               slug:
 *                 type: string
 *                 description: The slug for the booking
 *               tournamentId:
 *                 type: string
 *                 description: The ID of the tournament
 *               bookingDate:
 *                 type: string
 *                 format: date-time
 *                 description: The date of the booking
 *               usersId:
 *                 type: string
 *                 description: The ID of the user
 *               teeId:
 *                 type: string
 *                 description: The ID of the tee
 *               status:
 *                 type: string
 *                 enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *                 description: The status of the booking
 *               bookingRef:
 *                 type: integer
 *                 description: The reference number for the booking
 *     responses:
 *       201:
 *         description: Booking created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 id:
 *                   type: string
 *                 eventId:
 *                   type: string
 *                 classId:
 *                   type: string
 *                 slug:
 *                   type: string
 *                 tournamentId:
 *                   type: string
 *                 bookingDate:
 *                   type: string
 *                   format: date-time
 *                 usersId:
 *                   type: string
 *                 teeId:
 *                   type: string
 *                 status:
 *                   type: string
 *                   enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *                 bookingRef:
 *                   type: integer
 *       400:
 *         description: Bad request
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const createBooking = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");
    const data = BookingSchema.parse(req.body);
    const booking = await prisma.booking.create({
      data: {
        ...data,
        usersId,
      },
    });
    res.status(201).json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/bookings:
 *   get:
 *     summary: Retrieve a list of all completed bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of completed bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   slug:
 *                     type: string
 *                   name:
 *                     type: string
 *                   location:
 *                     type: string
 *                   date:
 *                     type: string
 *                     format: date-time
 *                   image:
 *                     type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const getAllBookings = async (req: Request, res: Response) => {
  const token = req.headers.authorization;
  if (!token) return res.status(403).send("Forbidden");
  const usersId = await getUser(token);
  if (!usersId) return res.status(401).send("Unauthorised");

  try {
    const bookings = await prisma.booking.findMany({
      where: {
        status: "Completed",
        usersId,
      },
      include: {
        event: {
          include: {
            ListedEvent: {
              select: {
                name: true,
                image: true,
                location: true,
              },
            },
          },
        },
        tee: {
          select: {
            startDate: true,
            organisation: {
              select: {
                name: true,
                image: true,
              },
            },
          },
        },
      },
    });
    const bookedEvents = bookings.flatMap((b) =>
      b.event
        ? {
            id: b.id,
            slug: b.slug,
            name: b.event?.ListedEvent.name,
            location: b.event?.ListedEvent.location,
            date: b.event?.startDate,
            image: b.event?.ListedEvent.image,
          }
        : undefined
    );
    const bookedTees = bookings.flatMap((b) =>
      b.tee
        ? {
            id: b.id,
            slug: b.slug,
            name: "Tee",
            location: b.tee?.organisation.name,
            date: b.tee?.startDate,
            image: b.tee?.organisation.image,
          }
        : undefined
    );
    const combinedEvents = [...bookedEvents, ...bookedTees];
    type CombinedEvent = {
      name: string;
      location: string;
      date: Date;
      image: string | null;
      id: string;
    };
    const processedEvents = combinedEvents.reduce<CombinedEvent[]>(
      (acc, item) => {
        if (item !== undefined) {
          acc.push(item);
        }
        return acc;
      },
      []
    );
    const today = new Date();
    const comingEvents = processedEvents.filter((e) => e.date > today);
    res.json(comingEvents);
  } catch (error) {
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/bookings/{id}:
 *   get:
 *     summary: Get a booking by its reference number
 *     tags: [Bookings]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: The booking reference number
 *     responses:
 *       200:
 *         description: The booking status
 *         content:
 *           application/json:
 *             schema:
 *               type: string
 *               enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *       404:
 *         description: Booking not found
 *       500:
 *         description: Internal server error
 */
export const getBooking = async (req: Request, res: Response) => {
  try {
    const bookingRef = Number(req.params.id);

    const booking = await prisma.booking.findUnique({
      where: { bookingRef },
      select: {
        status: true,
      },
    });
    if (booking) {
      const status = booking.status;
      res.json(status);
    } else {
      console.log("Error no booking found");
      res.status(404).send("Booking not found");
    }
  } catch (error) {
    res.status(500).send(error);
  }
};

/**
 * @swagger
 * /api/bookings/{id}:
 *   put:
 *     summary: Update a booking
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: The booking ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/BookingData'
 *     responses:
 *       200:
 *         description: The updated booking
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Booking'
 *       400:
 *         description: Invalid input data
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export const updateBooking = async (
  req: Request<IdParams, {}, BookingData>,
  res: Response
) => {
  try {
    const data = BookingSchema.parse(req.body);
    const id = z.string().parse(req.params?.id);
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");
    const booking = await prisma.booking.update({
      where: { id, usersId },
      data,
    });
    res.json(booking);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).send(error);
  }
};

export async function getUpcomingActivities(req: Request, res: Response) {
  // Get current date
  const currentDate = new Date();
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");
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
            tee: {
              startDate: {
                gt: currentDate,
              },
            },
          },
        ],
      },
      include: {
        event: true,
        class: {
          include: {
            organisation: true,
          },
        },
        tournament: {
          include: {
            organisation: true,
          },
        },
        tee: {
          include: {
            organisation: true,
          },
        },
      },
    });

    // Extract the activities from the bookings
    const activities = bookings
      .map((booking) => {
        return {
          ...booking.event,
          ...booking.class,
          ...booking.tournament,
          ...booking.tee,
          bookingDate: booking.bookingDate,
        };
      })
      .filter((activity) => activity.startDate); // Filter out undefined results

    // Sort by startDate
    activities.sort(
      (a, b) => a?.startDate?.getTime()! - b?.startDate?.getTime()!
    );

    return activities;
  } catch (error) {}
}

/**
 * @swagger
 * /api/bookings/tee:
 *   get:
 *     summary: Retrieve a list of tee bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of tee bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   eventId:
 *                     type: string
 *                   classId:
 *                     type: string
 *                   slug:
 *                     type: string
 *                   tournamentId:
 *                     type: string
 *                   bookingDate:
 *                     type: string
 *                     format: date-time
 *                   usersId:
 *                     type: string
 *                   teeId:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *                   bookingRef:
 *                     type: integer
 *                   totalAmount:
 *                     type: number
 *                   tee:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       organisation:
 *                         type: object
 *                         properties:
 *                           id:
 *                             type: string
 *                           name:
 *                             type: string
 *                           image:
 *                             type: string
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export async function getTeeBookings(req: Request, res: Response) {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");

    const bookings = await prisma.booking.findMany({
      where: {
        usersId: usersId,
        teeId: {
          not: null,
        },
      },
      include: {
        tee: {
          include: {
            organisation: {
              select: {
                id: true,
                name: true,
                image: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: {
        tee: {
          startDate: "asc",
        },
      },
    });

    // Calculate the total amount for each tee booking
    const bookingsWithAmount = await Promise.all(
      bookings.map(async (booking) => {
        let totalAmount = 0;
        if (booking?.tee?.kit === "Yes") {
          const kitCost = await prisma.kitPrices.findFirst({
            where: {
              organizationId: booking.tee.organisation.id,
            },
            select: {
              amount: true,
            },
          });
          totalAmount += kitCost ? kitCost.amount : 0;
        }

        const gameCost = await prisma.holesPrices.findFirst({
          where: {
            organizationId: booking?.tee?.organisation.id,
            numberOfHoles:
              booking?.tee?.holes === "9 holes" ? "Nine" : "Eighteen",
          },
          select: { amount: true },
        });
        totalAmount += gameCost ? gameCost.amount : 0;

        return {
          ...booking,
          totalAmount,
        };
      })
    );
    console.log(bookingsWithAmount?.at(0)?.totalAmount);
    res.json(bookingsWithAmount);
  } catch (error) {
    res.status(500).send(error);
  }
}

/**
 * @swagger
 * /api/bookings/tee/{organizationId}:
 *   get:
 *     summary: Retrieve a list of event bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the organization
 *     responses:
 *       200:
 *         description: A list of event bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   eventId:
 *                     type: string
 *                   classId:
 *                     type: string
 *                   slug:
 *                     type: string
 *                   tournamentId:
 *                     type: string
 *                   bookingDate:
 *                     type: string
 *                     format: date-time
 *                   usersId:
 *                     type: string
 *                   teeId:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *                   bookingRef:
 *                     type: integer
 *                   totalAmount:
 *                     type: number
 *                   event:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       package:
 *                         type: object
 *                         properties:
 *                           price:
 *                             type: number
 *                           name:
 *                             type: string
 *                       packageGroups:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             packages:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                                   price:
 *                                     type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

export async function getOrganizationsTeeBookings(req: Request, res: Response) {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");
    const { organizationId } = req.params;

    const bookings = await prisma.booking.findMany({
      where: {
        tee: {
          organizationId,
        },
        teeId: {
          not: null,
        },
      },
      include: {
        tee: {
          include: {
            organisation: {
              select: {
                id: true,
                name: true,
                image: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: {
        tee: {
          startDate: "asc",
        },
      },
    });

    // Calculate the total amount for each tee booking
    const bookingsWithAmount = await Promise.all(
      bookings.map(async (booking) => {
        let totalAmount = 0;
        if (booking?.tee?.kit === "Yes") {
          const kitCost = await prisma.kitPrices.findFirst({
            where: {
              organizationId: booking.tee.organisation.id,
            },
            select: {
              amount: true,
            },
          });
          totalAmount += kitCost ? kitCost.amount : 0;
        }

        const gameCost = await prisma.holesPrices.findFirst({
          where: {
            organizationId: booking?.tee?.organisation.id,
            numberOfHoles:
              booking?.tee?.holes === "9 holes" ? "Nine" : "Eighteen",
          },
          select: { amount: true },
        });
        totalAmount += gameCost ? gameCost.amount : 0;

        return {
          ...booking,
          totalAmount,
        };
      })
    );
    console.log(bookingsWithAmount?.at(0)?.totalAmount);
    res.json(bookingsWithAmount);
  } catch (error) {
    res.status(500).send(error);
  }
}

/**
 * @swagger
 * /api/bookings/tee/{organizationId}
 *   get:
 *     summary: Retrieve a list of event bookings for the authenticated user
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of event bookings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                   eventId:
 *                     type: string
 *                   classId:
 *                     type: string
 *                   slug:
 *                     type: string
 *                   tournamentId:
 *                     type: string
 *                   bookingDate:
 *                     type: string
 *                     format: date-time
 *                   usersId:
 *                     type: string
 *                   teeId:
 *                     type: string
 *                   status:
 *                     type: string
 *                     enum: [Pending, Completed, Failed, Refunded, Partial, Expired, Received, Rejected, Accepted]
 *                   bookingRef:
 *                     type: integer
 *                   totalAmount:
 *                     type: number
 *                   event:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       startDate:
 *                         type: string
 *                         format: date-time
 *                       package:
 *                         type: object
 *                         properties:
 *                           price:
 *                             type: number
 *                           name:
 *                             type: string
 *                       packageGroups:
 *                         type: array
 *                         items:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             packages:
 *                               type: array
 *                               items:
 *                                 type: object
 *                                 properties:
 *                                   id:
 *                                     type: string
 *                                   name:
 *                                     type: string
 *                                   price:
 *                                     type: number
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */

export async function getEventBookings(req: Request, res: Response) {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");

    const bookings = await prisma.booking.findMany({
      where: {
        usersId: usersId,
        eventId: {
          not: null,
        },
      },
      include: {
        event: {
          include: {
            package: true,
            ListedEvent: {
              include: {
                Package: true,
                PackageGroup: {
                  include: {
                    packages: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        event: {
          startDate: "asc",
        },
      },
    });

    // Calculate the total amount for each booking
    const bookingsWithAmount = await Promise.all(
      bookings.map(async (booking) => {
        let totalAmount = booking?.event?.package.price ?? 0;
        if (booking?.event?.kit === "Yes") {
          const kitCost = await prisma.kitPrices.findFirst({
            where: {
              listedEventId: booking.event?.listedEventId,
            },
            select: {
              amount: true,
            },
          });
          totalAmount += kitCost ? kitCost.amount : 0;
        }
        return {
          ...booking,
          totalAmount,
        };
      })
    );

    res.json(bookingsWithAmount);
  } catch (error) {
    res.status(500).send(error);
  }
}

/**
 * @swagger
 * /api/bookings/events/{id}:
 *   get:
 *     summary: Retrieve a list of event bookings for a specific event
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: organizationId
 *         required: true
 *         schema:
 *           type: string
 *         description: The ID of the organization
 *     responses:
 *       200:
 *         description: A list of event bookings for the organization
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EventBooking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export async function getOrganizationsEventBookings(
  req: Request,
  res: Response
) {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");
    const { id } = req.params;

    const bookings = await prisma.booking.findMany({
      where: {
        event: {
          ListedEvent: {
            id,
          },
        },
        eventId: {
          not: null,
        },
      },
      include: {
        event: {
          include: {
            package: true,
            ListedEvent: {
              include: {
                Package: true,
                PackageGroup: {
                  include: {
                    packages: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        event: {
          startDate: "asc",
        },
      },
    });

    // Calculate the total amount for each booking
    const bookingsWithAmount = await Promise.all(
      bookings.map(async (booking) => {
        let totalAmount = booking?.event?.package.price ?? 0;
        if (booking?.event?.kit === "Yes") {
          const kitCost = await prisma.kitPrices.findFirst({
            where: {
              listedEventId: booking.event?.listedEventId,
            },
            select: {
              amount: true,
            },
          });
          totalAmount += kitCost ? kitCost.amount : 0;
        }
        return {
          ...booking,
          totalAmount,
        };
      })
    );

    res.json(bookingsWithAmount);
  } catch (error) {
    res.status(500).send(error);
  }
}

// ... existing code ...

/**
 * @swagger
 * /api/bookings/tee/all:
 *   get:
 *     summary: Retrieve a list of tee bookings for all organizations
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of tee bookings for all organizations
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/TeeBooking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export async function getAllOrganizationsTeeBookings(
  req: Request,
  res: Response
) {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");

    const bookings = await prisma.booking.findMany({
      where: {
        teeId: {
          not: null,
        },
      },
      include: {
        tee: {
          include: {
            organisation: {
              select: {
                id: true,
                name: true,
                image: true,
                location: true,
              },
            },
          },
        },
      },
      orderBy: {
        tee: {
          startDate: "asc",
        },
      },
    });

    // Calculate the total amount for each tee booking
    const bookingsWithAmount = await Promise.all(
      bookings.map(async (booking) => {
        let totalAmount = 0;
        if (booking?.tee?.kit === "Yes") {
          const kitCost = await prisma.kitPrices.findFirst({
            where: {
              organizationId: booking.tee.organisation.id,
            },
            select: {
              amount: true,
            },
          });
          totalAmount += kitCost ? kitCost.amount : 0;
        }

        const gameCost = await prisma.holesPrices.findFirst({
          where: {
            organizationId: booking?.tee?.organisation.id,
            numberOfHoles:
              booking?.tee?.holes === "9 holes" ? "Nine" : "Eighteen",
          },
          select: { amount: true },
        });
        totalAmount += gameCost ? gameCost.amount : 0;

        return {
          ...booking,
          totalAmount,
        };
      })
    );

    res.json(bookingsWithAmount);
  } catch (error) {
    res.status(500).send(error);
  }
}

// ... existing code ...

/**
 * @swagger
 * /api/bookings/events/all:
 *   get:
 *     summary: Retrieve a list of event bookings for all events
 *     tags: [Bookings]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: A list of event bookings for all events
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EventBooking'
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden
 *       500:
 *         description: Internal server error
 */
export async function getAllOrganizationsEventBookings(
  req: Request,
  res: Response
) {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorised");

    const bookings = await prisma.booking.findMany({
      where: {
        eventId: {
          not: null,
        },
      },
      include: {
        event: {
          include: {
            package: true,
            ListedEvent: {
              include: {
                Package: true,
                PackageGroup: {
                  include: {
                    packages: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        event: {
          startDate: "asc",
        },
      },
    });
    console.log(bookings);
    // Calculate the total amount for each booking
    const bookingsWithAmount = await Promise.all(
      bookings.map(async (booking) => {
        let totalAmount = booking?.event?.package.price ?? 0;
        if (booking?.event?.kit === "Yes") {
          const kitCost = await prisma.kitPrices.findFirst({
            where: {
              listedEventId: booking.event?.listedEventId,
            },
            select: {
              amount: true,
            },
          });
          totalAmount += kitCost ? kitCost.amount : 0;
        }
        return {
          ...booking,
          totalAmount,
        };
      })
    );

    res.json(bookingsWithAmount);
  } catch (error) {
    res.status(500).send(error);
  }
}

// ... existing code ...
