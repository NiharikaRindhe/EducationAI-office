import type { Request, Response, NextFunction } from 'express';
import * as admitCardService from '../services/admitCard.service.js';
import { requireId } from '../lib/httpParams.js';

export async function downloadAllAdmitCardsController(req: Request, res: Response, next: NextFunction) {
  try {
    const zip = await admitCardService.generateAllAdmitCards(req.user!.id, requireId(req, 'examId'));
    res.setHeader('Content-Type', 'application/zip');
    res.setHeader('Content-Disposition', 'attachment; filename="admit-cards.zip"');
    res.send(zip);
  } catch (err) {
    next(err);
  }
}

export async function downloadOwnAdmitCardController(req: Request, res: Response, next: NextFunction) {
  try {
    const pdf = await admitCardService.generateOneAdmitCard(requireId(req, 'examId'), req.user!.id);
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="admit-card.pdf"');
    res.send(pdf);
  } catch (err) {
    next(err);
  }
}
