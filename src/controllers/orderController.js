const { db } = require('../config/db');

exports.getOrders = async (req, res) => {
  try {
    const { role, id: userId } = req.user;
    
    let query = `
      SELECT o.*, u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone
      FROM orders o
      LEFT JOIN users u ON o.user_id::uuid = u.id::uuid
    `;
    const params = [];

    // If not admin, only show their own orders
    if (role !== 'admin') {
      query += ` WHERE o.user_id::uuid = ?::uuid`;
      params.push(userId);
    }
    
    query += ` ORDER BY o.created_at DESC`;

    const orders = await db.all(query, params);
    res.json(orders);
  } catch (error) {
    console.error("Error fetching orders:", error);
    res.status(500).json({ error: "Failed to fetch orders" });
  }
};

exports.getOrderDetails = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const order = await db.get(`
      SELECT o.*, u.full_name as customer_name, u.email as customer_email, u.phone as customer_phone, u.address as customer_address
      FROM orders o
      LEFT JOIN users u ON o.user_id::uuid = u.id::uuid
      WHERE o.id = ?
    `, [id]);

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Check permissions
    if (role !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    const items = await db.all(`
      SELECT oi.*, p.name as product_name
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
      WHERE oi.order_id = ?
    `, [id]);

    res.json({ ...order, items });
  } catch (error) {
    console.error("Error fetching order details:", error);
    res.status(500).json({ error: "Failed to fetch order details" });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const { id } = req.params;
    const { role, id: userId } = req.user;

    const order = await db.get("SELECT user_id, status FROM orders WHERE id = ?", [id]);
    if (!order) return res.status(404).json({ error: "Order not found" });

    // Permissions
    if (role !== 'admin' && order.user_id !== userId) {
      return res.status(403).json({ error: "Forbidden" });
    }

    if (order.status === 'paid') {
      return res.status(400).json({ error: "Cannot modify a paid order" });
    }

    const status = req.body.status || 'cancelled';
    await db.run("UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?", [status, id]);
    res.json({ success: true, message: `Order marked as ${status}` });
  } catch (error) {
    console.error("Error cancelling order:", error);
    res.status(500).json({ error: "Failed to cancel order" });
  }
};
