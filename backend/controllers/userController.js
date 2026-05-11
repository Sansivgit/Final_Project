import User from '../models/User.js';
import Order from '../models/Order.js';

const iso = (d) => {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : new Date(d).toISOString();
};

const mapCustomerRow = (u, stats) => ({
  id: String(u._id),
  name: u.name,
  email: u.email,
  phone: u.phone || '',
  avatarUrl: u.avatar || '',
  createdAt: iso(u.createdAt),
  isBlocked: Boolean(u.isBlocked),
  totalOrders: stats?.totalOrders ?? 0,
  totalSpent: stats?.totalSpent ?? 0,
  totalProductsPurchased: stats?.totalProductsPurchased ?? 0,
  lastPurchaseAt: stats?.lastPurchaseAt ? iso(stats.lastPurchaseAt) : null,
});

export const listUsers = async (req, res, next) => {
  try {
    const { search } = req.query;
    const q = { role: 'user' };
    if (search) {
      q.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
        { phone: new RegExp(search, 'i') },
      ];
    }
    const users = await User.find(q).select('-password').sort({ createdAt: -1 }).lean();
    const ids = users.map((u) => u._id);

    const statsAgg =
      ids.length === 0
        ? []
        : await Order.aggregate([
            { $match: { user: { $in: ids } } },
            {
              $group: {
                _id: '$user',
                totalOrders: { $sum: 1 },
                totalSpent: { $sum: '$totalAmount' },
                lastPurchaseAt: { $max: '$createdAt' },
                totalProductsPurchased: {
                  $sum: {
                    $reduce: {
                      input: '$items',
                      initialValue: 0,
                      in: { $add: ['$$value', '$$this.quantity'] },
                    },
                  },
                },
              },
            },
          ]);

    const statsMap = Object.fromEntries(
      statsAgg.map((s) => [
        String(s._id),
        {
          totalOrders: s.totalOrders,
          totalSpent: s.totalSpent,
          totalProductsPurchased: s.totalProductsPurchased,
          lastPurchaseAt: s.lastPurchaseAt,
        },
      ]),
    );

    const payload = users.map((u) => mapCustomerRow(u, statsMap[String(u._id)]));
    res.json(payload);
  } catch (e) {
    next(e);
  }
};

function uniqueShippingAddresses(orders) {
  const seen = new Set();
  const list = [];
  for (const o of orders) {
    const a = o.shippingAddress;
    if (!a?.line1) continue;
    const key = [a.line1, a.city, a.postalCode, a.country].join('|');
    if (seen.has(key)) continue;
    seen.add(key);
    list.push({
      fullName: a.fullName || '',
      line1: a.line1 || '',
      line2: a.line2 || '',
      city: a.city || '',
      postalCode: a.postalCode || '',
      country: a.country || '',
    });
  }
  return list;
}

export const getUserAdminDetails = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id).select('-password').lean();
    if (!user || user.role !== 'user') {
      return res.status(404).json({ message: 'User not found' });
    }

    const orders = await Order.find({ user: user._id })
      .sort({ createdAt: -1 })
      .lean();

    const orderPayload = orders.map((o) => ({
      id: String(o._id),
      orderNumber: o.orderNumber || '',
      createdAt: iso(o.createdAt),
      totalAmount: o.totalAmount,
      status: o.status,
      paymentSummary: o.paymentSummary || '',
      shippingAddress: o.shippingAddress || null,
      items: (o.items || []).map((it) => ({
        title: it.title,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
      })),
    }));

    const recentlyPurchased = [];
    const seenTitles = new Set();
    for (const o of orders) {
      for (const it of o.items || []) {
        const key = `${it.title}-${it.unitPrice}`;
        if (seenTitles.has(key)) continue;
        seenTitles.add(key);
        recentlyPurchased.push({
          title: it.title,
          quantity: it.quantity,
          unitPrice: it.unitPrice,
        });
        if (recentlyPurchased.length >= 8) break;
      }
      if (recentlyPurchased.length >= 8) break;
    }

    const lifetimeTotal = orders.reduce((s, o) => s + o.totalAmount, 0);

    const timeline = [
      {
        type: 'account',
        title: 'Account created',
        at: iso(user.createdAt),
        meta: null,
      },
      ...orders.map((o) => ({
        type: 'order',
        title: `Order ${o.orderNumber || String(o._id).slice(-6)}`,
        at: iso(o.createdAt),
        meta: `$${Number(o.totalAmount).toFixed(2)} · ${o.status}`,
      })),
    ].sort((a, b) => new Date(b.at) - new Date(a.at));

    res.json({
      user: mapCustomerRow(
        user,
        orders.length
          ? {
              totalOrders: orders.length,
              totalSpent: lifetimeTotal,
              totalProductsPurchased: orders.reduce(
                (acc, o) =>
                  acc +
                  (o.items || []).reduce((s, it) => s + it.quantity, 0),
                0,
              ),
              lastPurchaseAt: orders[0]?.createdAt ? iso(orders[0].createdAt) : null,
            }
          : null,
      ),
      orders: orderPayload,
      shippingAddresses: uniqueShippingAddresses(orders),
      paymentSummary: {
        lifetimeTotal,
        orderCount: orders.length,
        lastPaymentLabel: orders[0]?.paymentSummary || null,
      },
      recentlyPurchased,
      timeline,
    });
  } catch (e) {
    next(e);
  }
};

export const deleteUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') {
      return res.status(404).json({ message: 'User not found' });
    }
    await user.deleteOne();
    res.json({ message: 'User deleted' });
  } catch (e) {
    next(e);
  }
};

export const toggleBlockUser = async (req, res, next) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user || user.role === 'admin') {
      return res.status(404).json({ message: 'User not found' });
    }
    user.isBlocked = !user.isBlocked;
    await user.save();
    res.json(user);
  } catch (e) {
    next(e);
  }
};
