import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
const prisma = new PrismaClient();
export const getLatestBoard = async (req:Request, res:Response) => {
    try {
        const board = await prisma.leaderBoard.findFirst({
            select: {
                LeaderBoardPoint: {
                    select: {
                        points: true,
                        user: {
                            select: {
                               Profile: {
                                select: {
                                    name: true
                                }
                               } 
                            }
                        }
                    },
                    orderBy: {
                        points: 'asc'
                    }
                }
            },
            orderBy: {
                date: "desc"
            }
        });

        if (board) {
            const formattedBoard=board.LeaderBoardPoint.map(b=> ({points:b.points, user: b.user.Profile?.name}))
            
            res.json(formattedBoard);
        } else {
            res.status(404).send("Leaderboard not found");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while retrieving the leaderboard");
    }
}