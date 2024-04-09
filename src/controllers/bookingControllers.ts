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
      image: string;
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

export const getBooking = async (req: Request, res: Response) => {
  try {
    const bookingRef = Number(req.params.id);
    console.log("bookingref", bookingRef);
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
            organisation: true,
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
            ListedEvent: true,
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
