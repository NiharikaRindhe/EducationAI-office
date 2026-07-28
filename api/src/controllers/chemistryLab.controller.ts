import type { Request, Response, NextFunction } from 'express';
import { craftCompoundSchema, freeReactSchema } from '../schemas/chemistryLab.schema.js';
import * as chemistryLabService from '../services/chemistryLab.service.js';

export async function craftCompoundController(req: Request, res: Response, next: NextFunction) {
  try {
    const { elements, attempted_formula } = craftCompoundSchema.parse(req.body);
    const result = await chemistryLabService.craftCompound(req.user!.id, elements, attempted_formula, {
      schoolId: req.user!.schoolId,
      userId: req.user!.id,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}

export async function freeReactController(req: Request, res: Response, next: NextFunction) {
  try {
    const { reactants } = freeReactSchema.parse(req.body);
    const result = await chemistryLabService.freeReact(req.user!.id, reactants, {
      schoolId: req.user!.schoolId,
      userId: req.user!.id,
    });
    res.json(result);
  } catch (err) {
    next(err);
  }
}
