import Subscriber from '../models/Subscriber.js';

export const subscribe = async (req, res, next) => {
  try {
    const email = String(req.body.email ?? '')
      .trim()
      .toLowerCase();
    if (!email) {
      return res.status(400).json({ message: 'Email is required' });
    }

    const exists = await Subscriber.findOne({ email });
    if (exists) {
      return res.status(409).json({ message: 'Already subscribed' });
    }

    await Subscriber.create({ email });
    res.status(201).json({ message: 'You are subscribed' });
  } catch (e) {
    if (e?.code === 11000) {
      return res.status(409).json({ message: 'Already subscribed' });
    }
    next(e);
  }
};
