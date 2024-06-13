import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
// Adjust the import based on your actual prisma client path
const prisma = new PrismaClient();
/**
 * @swagger
 * /api/data:
 *   get:
 *     summary: Fetch all data from various tables
 *     tags: [Data]
 *     responses:
 *       200:
 *         description: Successfully fetched data
 *       500:
 *         description: Internal server error
 */
export const fetchData = async (req: Request, res: Response) => {
  try {
    const organizations = await prisma.organization.findMany();
    const holesPrices = await prisma.holesPrices.findMany();
    const kitsPrices = await prisma.kitPrices.findMany();
    const listedEvents = await prisma.listedEvent.findMany();
    const packageGroups = await prisma.packageGroup.findMany();
    const packages = await prisma.package.findMany();
    const partners = await prisma.partner.findMany();
    const leaderBoards = await prisma.leaderBoard.findMany();
    const leaderBoardPoints = await prisma.leaderBoardPoint.findMany();

    res.status(200).json({
      organizations,
      holesPrices,
      kitsPrices,
      listedEvents,
      packageGroups,
      packages,
      partners,
      leaderBoards,
      leaderBoardPoints,
    });
  } catch (error) {
    console.error("Error fetching data:", error);
    res.status(500).json({ error: error });
  }
};
