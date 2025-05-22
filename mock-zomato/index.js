import express from 'express';
import { initDB } from './db.js';
import { generateRandomOrders } from './data.js';

const app = express();
const port = 9000;
app.use(express.json());

const db = await initDB();

// Seed DB if empty
const existing = await db.get(`SELECT COUNT(*) as count FROM orders`);
if (existing.count === 0) {
  const orders = generateRandomOrders();
  for (const order of orders) {
    await db.run(`INSERT INTO orders (id, customer, location, status) VALUES (?, ?, ?, ?)`, 
      order.id, order.customer, order.location, order.status);
  }
}

// GET /orders
app.get('/orders', async (req, res) => {
  const orders = await db.all(`SELECT * FROM orders`);
  res.json({ orders });
});

// POST /pickup
app.post('/pickup', async (req, res) => {
  const { id } = req.body;
  await db.run(`UPDATE orders SET status = 'picked' WHERE id = ?`, id);
  const order = await db.get(`SELECT * FROM orders WHERE id = ?`, id);
  console.log(`message: 'Order picked up'${order}`)
  res.json({ message: 'Order picked up', order });
});

app.listen(port, () => {
  console.log(`Mock Zomato API running at http://localhost:${port}`);
});

