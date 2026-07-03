import type { Request, Response, NextFunction } from 'express';
import * as admitCardService from '../services/admitCard.service.js';
import { ApiError } from '../lib/errors.js';

function requireId(req: Request, name = 'examId'): string {
  const value = req.params[name];
  if (!value) throw new ApiError('VALIDATION_ERROR', `Missing ${name} in path`);
  return value;
}

export async function downloadAllAdmitCardsController(req: Request, res: Response, next: NextFunction) {
  try {
    const zip = await admitCardService.generateAllAdmitCards(req.user!.id, requireId(req));
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="admit-cards.zip"');
    res.send(zip);
  } catch (err) {
    next(err);
  }
}

export async function downloadOwnAdmitCardController(req: Request, res: Response, next: NextFunction) {
  try {
    const pdf = await admitCardService.generateOneAdmitCard(requireId(req), req.user!.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="admit-card.pdf"');
    res.send(pdf);
  } catch (err) {
    next(err);
  }
}
