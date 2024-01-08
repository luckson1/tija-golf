import { PrismaClient } from "@prisma/client";
import { Request, Response } from "express";
const prisma = new PrismaClient();
export const getLatestBoard = async (req:Request, res:Response) => {
    try {
        const board = await prisma.leaderBoard.findFirst({
            orderBy: {
                date: "desc"
            }
        });

        if (board) {
            res.json(board);
        } else {
            res.status(404).send("Leaderboard not found");
        }
    } catch (error) {
        console.error(error);
        res.status(500).send("An error occurred while retrieving the leaderboard");
    }
}