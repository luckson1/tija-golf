import { PrismaClient } from "@prisma/client";
import { z } from "zod";
import { Request, Response } from "express";
import { getUser } from "../utils";
import { parseISO, setHours, setMinutes, startOfDay, addHours } from "date-fns";

const prisma = new PrismaClient();
const timeRegex = /^(0?[1-9]|1[0-2]):[0-5][0-9] [ap]m$/;
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
  if (modifier.toUpperCase() === "pm") {
    hours += 12;
  }

  date = setHours(date, hours);
  date = setMinutes(date, minutes);
  // adjust for EAC time
  date = addHours(date, -3);

  return date;
}

type IdParams = {
  id?: string;
};
type TeeData = z.infer<typeof TeeSchema>;
const TeeSchema = z.object({
  holes: z.enum(["9 holes", "18 holes"]),
  kit: z.enum(["Yes", "No"]),

  organizationId: z.string().min(1, "Organization ID is required"),
  date: z.string().datetime(),
  startTime: z.string().regex(timeRegex, {
    message: "Invalid time format. Use HH:MM in 24-hour format.",
  }),
});

const CreatePaymentSchema = z.object({
  bookingId: z.string(),
  usersId: z.string(),
  amount: z.number(),
  teeId: z.string(),
  organizationId: z.string(),
});

/**
 * @swagger
 * /api/tee:
 *   post:
 *     summary: Create a new tee booking
 *     tags: [Tee]
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
 *               organizationId:
 *                 type: string
 *                 description: The ID of the organization
 *               date:
 *                 type: string
 *                 format: date
 *                 description: The date of the tee booking
 *               startTime:
 *                 type: string
 *                 description: The start time of the tee booking
 *     responses:
 *       201:
 *         description: Tee booking created successfully
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
 *                     tee:
 *                       type: object
 *                       properties:
 *                         id:
 *                           type: string
 *                         startDate:
 *                           type: string
 *                           format: date-time
 *                         organisation:
 *                           type: object
 *                           properties:
 *                             id:
 *                               type: string
 *                             name:
 *                               type: string
 *                             image:
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

export const createTee = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const parsedData = TeeSchema.parse(req.body);
    const startDate = combineDateAndTime(parsedData.date, parsedData.startTime);

    const { holes, kit, organizationId } = parsedData;

    const result = await prisma.$transaction(async (prisma) => {
      const newTee = await prisma.tee.create({
        data: {
          holes,
          kit,
          organizationId,
          startDate,
        },
      });

      const booking = await prisma.booking.create({
        data: {
          usersId,
          teeId: newTee.id,
        },
      });
      const updatedBooking = await prisma.booking.update({
        where: { id: booking.id },
        data: {
          slug: `T-${booking?.bookingRef}`,
        },
        include: {
          tee: true,
        },
      });
      const kitCost =
        kit === "Yes"
          ? await prisma.kitPrices.findFirst({
              where: {
                organizationId,
              },
              select: {
                amount: true,
              },
            })
          : null;

      const gameCost =
        holes === "9 holes"
          ? await prisma.holesPrices.findFirst({
              where: {
                organizationId,
                numberOfHoles: "Nine",
              },
              select: { amount: true },
            })
          : await prisma.holesPrices.findFirst({
              where: {
                organizationId,
                numberOfHoles: "Eighteen",
              },
              select: { amount: true },
            });

      const amount = (kitCost?.amount ?? 0) + (gameCost?.amount ?? 0);

      return { updatedBooking, amount };
    });

    res.status(201).json(result);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors.at(0)?.message);
    }
    res.status(500).send(error);
  }
};

export const getAllTees = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const Tees = await prisma.tee.findMany({
      include: {
        organisation: true,
        bookings: true,
        payments: true,
      },
    });

    res.json(Tees);
  } catch (error) {
    res.status(500).send(error);
  }
};

export const getTee = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const { id } = req.params;
    const parsedData = z.string().parse(id);

    const tee = await prisma.tee.findUnique({
      where: { id: parsedData },
      include: {
        organisation: true,
        bookings: true,
        payments: true,
      },
    });

    if (tee) {
      res.json(tee);
    } else {
      res.status(404).send("Tee not found");
    }
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).send(error);
  }
};

export const updateTee = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const { id } = req.params;
    const parsedId = z.string().parse(id);

    const updateData = TeeSchema.parse(req.body);

    let startDate;
    if (updateData.date && updateData.startTime) {
      startDate = combineDateAndTime(updateData.date, updateData.startTime);
    }
    const { holes, kit, organizationId } = updateData;

    const updatedTee = await prisma.tee.update({
      where: { id: parsedId },
      data: {
        holes,
        kit,
        organizationId,
        ...(startDate && { startDate }),
      },
    });
    const kitCost =
      updateData.kit === "Yes"
        ? await prisma.kitPrices.findFirst({
            where: {
              organizationId: updateData.organizationId,
            },
            select: {
              amount: true,
            },
          })
        : null;

    const gameCost =
      updateData.holes === "9 holes"
        ? await prisma.holesPrices.findFirst({
            where: {
              organizationId: updateData.organizationId,
              numberOfHoles: "Nine",
            },
            select: { amount: true },
          })
        : await prisma.holesPrices.findFirst({
            where: {
              organizationId: updateData.organizationId,
              numberOfHoles: "Eighteen",
            },
            select: { amount: true },
          });

    const amount = (kitCost?.amount ?? 0) + (gameCost?.amount ?? 0);
    res.json({ updatedTee, amount });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json(error.errors);
    }
    res.status(500).send(error);
  }
};

export const createPayment = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization;
    if (!token) return res.status(403).send("Forbidden");
    const usersId = await getUser(token);
    if (!usersId) return res.status(401).send("Unauthorized");

    const parsedData = CreatePaymentSchema.parse(req.body);

    const payment = await prisma.payment.create({
      data: {
        bookingId: parsedData.bookingId,
        usersId: parsedData.usersId,
        amount: parsedData.amount,
        organizationId: parsedData.organizationId,
        ...(parsedData.teeId && { teeId: parsedData.teeId }),
      },
    });

    res.status(201).json(payment);
  } catch (error) {
    if (error instanceof z.ZodError) {
      res.status(400).json({ errors: error.issues });
    } else {
      res.status(500).send("An unexpected error occurred");
    }
  }
};
