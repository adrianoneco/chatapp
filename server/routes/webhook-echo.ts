import { Router, type Request, type Response } from "express";

const router = Router();

// simple echo endpoint to help testing webhooks locally
router.post('/webhook-echo', async (req: Request, res: Response) => {
  try {
    console.log('[webhook-echo] received payload:', JSON.stringify(req.body).slice(0, 2000));
    res.json({ received: true, body: req.body });
  } catch (err) {
    console.error('[webhook-echo] error:', err);
    res.status(500).json({ error: 'echo failed' });
  }
});

export default router;
