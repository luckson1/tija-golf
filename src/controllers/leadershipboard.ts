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
    console.log(board);
    if (board) {
      const formattedBoard = board.LeaderBoardPoint.map((b) => ({
        id: b.id,
        points: b.points,
        user: b.profile?.name,
      }));

      res.json(formattedBoard);
    } else {
      return [];
    }
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while retrieving the leaderboard");
  }
};
