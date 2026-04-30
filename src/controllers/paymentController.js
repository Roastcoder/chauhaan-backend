const Razorpay = require('razorpay');
const crypto = require('crypto');
const { db } = require('../config/db');

// Helper to get Razorpay instance lazily
const getRazorpayInstance = () => {
  if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
    throw new Error('Razorpay keys are not configured in environment variables');
  }
  return new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
  });
};

exports.createOrder = async (req, res) => {
  try {
    const { items, currency = "INR", receipt, shipping_address, customer_phone } = req.body;
    const userId = req.user.id;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "At least one item is required" });
    }

    // Securely calculate total amount from DB prices
    let totalAmount = 0;
    const verifiedItems = [];

    for (const item of items) {
      const product = await db.get("SELECT id, name, price FROM products WHERE id = ?", [item.product_id]);
      if (!product) {
        return res.status(404).json({ error: `Product not found: ${item.product_id}` });
      }
      
      const price = Number(product.price);
      const quantity = Math.max(1, parseInt(item.quantity) || 1);
      totalAmount += price * quantity;
      
      verifiedItems.push({
        product_id: product.id,
        product_name: product.name,
        quantity,
        price
      });
    }

    const options = {
      amount: Math.round(totalAmount * 100), // amount in paise
      currency,
      receipt: receipt || `receipt_${Date.now()}`
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ error: "Razorpay order creation failed" });
    }

    // Save order to DB (use verified totalAmount)
    await db.run(
      `INSERT INTO orders (id, user_id, amount, currency, receipt, status, shipping_address, customer_phone) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [order.id, userId, totalAmount, currency, options.receipt, 'created', shipping_address, customer_phone]
    );

    // Save order items to DB
    for (const item of verifiedItems) {
      await db.run(
        `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
        [order.id, item.product_id, item.quantity, item.price]
      );
    }

    res.json(order);
  } catch (error) {
    console.error("Error creating razorpay order:", error);
    res.status(500).json({ error: error.message || "Failed to create order" });
  }
};

exports.verifyPayment = async (req, res) => {
  try {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature === expectedSign) {
      // Payment is successful, update order status in DB
      await db.run(
        `UPDATE orders SET status = ?, razorpay_payment_id = ?, razorpay_signature = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        ['paid', razorpay_payment_id, razorpay_signature, razorpay_order_id]
      );

      // --- LOYALTY REWARDS LOGIC ---
      // 1. Get the order details to find user and amount
      const order = await db.get("SELECT user_id, amount FROM orders WHERE id = ?", [razorpay_order_id]);
      
      if (order) {
        // 2. Calculate points (1 point per 100 INR)
        const pointsToEarn = Math.floor(Number(order.amount) / 100);
        
        if (pointsToEarn > 0) {
          // 3. Update user's total loyalty points
          await db.run(
            "UPDATE loyalty_points SET points = points + ?, updated_at = CURRENT_TIMESTAMP WHERE user_id = ?",
            [pointsToEarn, order.user_id]
          );

          // 4. Log the transaction
          const { v4: uuidv4 } = require('uuid');
          await db.run(
            "INSERT INTO loyalty_transactions (id, user_id, points, type, description) VALUES (?, ?, ?, ?, ?)",
            [uuidv4(), order.user_id, pointsToEarn, 'earn', `Points earned from purchase (Order #${razorpay_order_id.split('_')[1]})`]
          );
        }
      }
      
      return res.status(200).json({ message: "Payment verified and loyalty points awarded", success: true });
    } else {
      // Mark order as failed
      await db.run(
        `UPDATE orders SET status = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        ['failed', razorpay_order_id]
      );
      return res.status(400).json({ error: "Invalid signature sent!", success: false });
    }
  } catch (error) {
    console.error("Error verifying payment:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
};
