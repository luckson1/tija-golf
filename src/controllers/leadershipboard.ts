import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";

const prisma = new PrismaClient();

export const getLatestBoard = async (req: Request, res: Response) => {
  try {
    const board = await prisma.leaderBoard.findFirst({
      select: {
        LeaderBoardPoint: {
          select: {
            id: true,
            points: true,
            profile: {
              select: {
                name: true,
              },
            },
          },
          orderBy: {
            points: "asc",
          },
        },
      },
      orderBy: {
        date: "desc",
      },
    });

    if (!board || board.LeaderBoardPoint.length === 0) {
      // Instead of sending an error, send a friendly message with a 200 OK status.
      res.json({ message: "The leaderboard is currently empty." });
      return;
    }

    const formattedBoard = board.LeaderBoardPoint.map((b) => ({
      id: b.id,
      points: b.points,
      user: b.profile?.name,
    }));

    res.json(formattedBoard);
    await prisma.$disconnect();
  } catch (error) {
    console.error("Error retrieving the leaderboard:", error);
    res.status(500).send("An error occurred while retrieving the leaderboard");
    await prisma.$disconnect();
  }
};
