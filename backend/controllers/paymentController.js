import crypto from 'crypto';
import Razorpay from 'razorpay';

let razorpay;
const getRazorpay = () => {
  if (!razorpay && process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET) {
    razorpay = new Razorpay({
      key_id: process.env.RAZORPAY_KEY_ID,
      key_secret: process.env.RAZORPAY_KEY_SECRET,
    });
  }
  return razorpay;
};

export const createOrder = async (req, res, next) => {
  try {
    const client = getRazorpay();
    if (!client) {
      return res.status(503).json({ message: 'Payments not configured' });
    }
    const { amount, currency = 'INR', receipt } = req.body;
    const order = await client.orders.create({
      amount: Math.round(Number(amount) * 100),
      currency,
      receipt: receipt || `rcpt_${Date.now()}`,
    });
    res.json(order);
  } catch (e) {
    next(e);
  }
};

export const verifyPayment = async (req, res, next) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) {
      return res.status(503).json({ message: 'Payments not configured' });
    }
    const body = `${razorpay_order_id}|${razorpay_payment_id}`;
    const expected = crypto.createHmac('sha256', secret).update(body).digest('hex');
    if (expected !== razorpay_signature) {
      return res.status(400).json({ message: 'Invalid signature' });
    }
    res.json({ verified: true });
  } catch (e) {
    next(e);
  }
};
