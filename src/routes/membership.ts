import express from 'express';
import { createMembership, getMembership, updateMembership, deleteMembership } from '../controllers/membership';

const membershipRoute = express.Router();

membershipRoute.post('/', createMembership);
membershipRoute.get('/:id', getMembership);
membershipRoute.put('/:id', updateMembership);
membershipRoute.delete('/:id', deleteMembership);

export default membershipRoute;
