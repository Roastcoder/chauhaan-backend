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
    const { amount, currency = "INR", receipt, items } = req.body;
    const userId = req.user.id;

    if (!amount) {
      return res.status(400).json({ error: "Amount is required" });
    }

    const options = {
      amount: amount * 100, // amount in the smallest currency unit
      currency,
      receipt: receipt || `receipt_${Date.now()}`
    };

    const razorpay = getRazorpayInstance();
    const order = await razorpay.orders.create(options);
    
    if (!order) {
      return res.status(500).json({ error: "Some error occurred while creating order" });
    }

    // Save order to DB
    await db.run(
      `INSERT INTO orders (id, user_id, amount, currency, receipt, status) VALUES (?, ?, ?, ?, ?, ?)`,
      [order.id, userId, amount, currency, options.receipt, 'created']
    );

    // Save order items to DB if provided
    if (items && Array.isArray(items)) {
      for (const item of items) {
        await db.run(
          `INSERT INTO order_items (order_id, product_id, quantity, price) VALUES (?, ?, ?, ?)`,
          [order.id, item.product_id, item.quantity, item.price]
        );
      }
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
      
      return res.status(200).json({ message: "Payment verified successfully", success: true });
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
