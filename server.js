require('dotenv').config();
const express = require('express');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static assets from the current directory
app.use(express.static(__dirname));

// Public config route to provide frontend with KEY_ID dynamically
app.get('/api/config', (req, res) => {
  res.status(200).json({
    key_id: process.env.RAZORPAY_KEY_ID || ''
  });
});

// Create Order Route
app.post('/api/create-order', async (req, res) => {
  const { amount, currency, receipt } = req.body;

  // Validate amount >= 100 paise (1 INR)
  if (!amount || amount < 100) {
    return res.status(400).json({ error: 'Amount must be at least 100 paise (1 INR)' });
  }

  const keyId = process.env.RAZORPAY_KEY_ID;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keyId || !keySecret) {
    return res.status(500).json({ error: 'Razorpay API credentials not configured on server' });
  }

  try {
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret,
    });

    const options = {
      amount: parseInt(amount, 10),
      currency: currency || 'INR',
      receipt: receipt || `receipt_${Date.now()}`
    };

    const order = await instance.orders.create(options);
    res.status(200).json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    });
  } catch (error) {
    console.error('Error creating Razorpay order:', error);
    res.status(500).json({ error: error.message || 'Failed to create order' });
  }
});

// Verify Payment Route
app.post('/api/verify-payment', (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return res.status(400).json({ error: 'Missing required payment verification parameters' });
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET;

  if (!keySecret) {
    return res.status(500).json({ error: 'Razorpay API credentials not configured on server' });
  }

  try {
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      res.status(200).json({ verified: true });
    } else {
      res.status(400).json({ error: 'Signature verification failed. Potential tampering detected.' });
    }
  } catch (error) {
    console.error('Error verifying Razorpay payment:', error);
    res.status(500).json({ error: error.message || 'Verification process failed' });
  }
});

// Fallback route to serve index.html for undefined requests
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
