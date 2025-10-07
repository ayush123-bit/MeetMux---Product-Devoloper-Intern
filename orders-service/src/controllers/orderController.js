const OrderModel = require('../models/orderModel');
const axios = require('axios');


const USERS_BASE = process.env.USERS_BASE || 'http://localhost:3001';


async function fetchWithRetries(url, opts = {}, retries = 2, backoffMs = 200) {
  let lastErr;
  for (let i = 0; i <= retries; i++) {
    try {
      return await axios({ url, ...opts, timeout: 2000 });
    } catch (err) {
      lastErr = err;
      if (i < retries) await new Promise(r => setTimeout(r, backoffMs * (i + 1)));
    }
  }
  throw lastErr;
}

exports.listOrders = (req, res) => {
  res.json(OrderModel.findAll());
};

exports.getOrderById = (req, res) => {
  const order = OrderModel.findById(req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
};


exports.createOrder = async (req, res) => {
  const { id, userId, items, total } = req.body;
  if (!id || !userId || !items || !Array.isArray(items)) {
    return res.status(400).json({ error: 'id, userId, items required' });
  }


  try {
    const response = await fetchWithRetries(`${USERS_BASE}/users/${userId}`, { method: 'GET' }, 2, 200);
    if (response.status !== 200) {
      return res.status(502).json({ error: 'Failed to validate user' });
    }
    const user = response.data;
  
    if (typeof total === 'number' && user.balance < total) {
      return res.status(400).json({ error: 'Insufficient user balance' });
    }

 
    if (typeof total === 'number') {
    
      try {
        await axios.put(`${USERS_BASE}/users/${userId}`, { balance: user.balance - total }, { timeout: 2000 });
      } catch (err) {
        
        console.warn('Failed to update user balance', err.message);
      }
    }

    const order = OrderModel.create({ id, userId, items, total, status: 'CREATED', createdAt: new Date().toISOString() });
    return res.status(201).json(order);
  } catch (err) {
 
    console.error('Error communicating with user service:', err.message || err);
    return res.status(503).json({ error: 'User service unavailable', details: err.message });
  }
};
