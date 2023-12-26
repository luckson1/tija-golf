import { PrismaClient } from "@prisma/client";
import  { Request, Response } from 'express';
import { getUser } from "../utils";

const prisma = new PrismaClient();
export const getAllOrganisations = async (req:Request, res:Response) => {
    try {
        const usersId= await getUser()

        if (!usersId)  return   res.status(401).send('Unauthorised');
      const organizations = await prisma.organization.findMany({
        where: {
            OrganizationMember: {
                some: {
                    usersId
                }
            }
        }
      });
      res.json(organizations);
    } catch (error) {
      res.status(500).send(error);
    }
  };

  export const testOrganisations = async (req:Request, res:Response) => {
    try {
      
      const organizations = await prisma.organization.findMany(
      );
      res.json(organizations);
    } catch (error) {
      res.status(500).send(error);
    }
  };