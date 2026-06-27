const functions = require('firebase-functions');
const admin = require('firebase-admin');
const Razorpay = require('razorpay');
const crypto = require('crypto');

admin.initializeApp();
const db = admin.firestore();

// 1. SECURE ORDER CREATION FUNCTION
exports.createRazorpayOrder = functions.https.onCall(async (data, context) => {
  // Validate that the request is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to initiate checkout.');
  }

  const { amount } = data;
  const uid = context.auth.uid;

  if (!amount || amount < 100) {
    throw new functions.https.HttpsError('invalid-argument', 'Amount must be at least 100 paise (1 INR).');
  }

  // Get credentials from environment variables
  const keyId = process.env.RAZORPAY_KEY_ID || functions.config().razorpay.key_id;
  const keySecret = process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay.key_secret;

  if (!keyId || !keySecret) {
    throw new functions.https.HttpsError('failed-precondition', 'Razorpay API credentials are not configured on the server.');
  }

  try {
    const instance = new Razorpay({
      key_id: keyId,
      key_secret: keySecret
    });

    const options = {
      amount: parseInt(amount, 10),
      currency: 'INR',
      receipt: `receipt_uid_${uid}_${Date.now()}`
    };

    const order = await instance.orders.create(options);

    // Save a pending order record to the customer's Firestore document
    await db.collection('users').doc(uid).collection('orders').doc(order.id).set({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
      status: 'pending',
      created_at: admin.firestore.FieldValue.serverTimestamp()
    });

    return {
      order_id: order.id,
      amount: order.amount,
      currency: order.currency
    };
  } catch (error) {
    console.error('Error creating order:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Failed to create order');
  }
});

// 2. SECURE PAYMENT SIGNATURE VERIFICATION FUNCTION
exports.verifyRazorpayPayment = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be logged in to verify payment.');
  }

  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = data;
  const uid = context.auth.uid;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    throw new functions.https.HttpsError('invalid-argument', 'Missing required verification parameters.');
  }

  const keySecret = process.env.RAZORPAY_KEY_SECRET || functions.config().razorpay.key_secret;

  if (!keySecret) {
    throw new functions.https.HttpsError('failed-precondition', 'Razorpay API credentials are not configured on the server.');
  }

  try {
    const generated_signature = crypto
      .createHmac('sha256', keySecret)
      .update(razorpay_order_id + '|' + razorpay_payment_id)
      .digest('hex');

    if (generated_signature === razorpay_signature) {
      // Update order status in the user's Firestore order log
      await db.collection('users').doc(uid).collection('orders').doc(razorpay_order_id).update({
        status: 'paid',
        payment_id: razorpay_payment_id,
        paid_at: admin.firestore.FieldValue.serverTimestamp()
      });

      return { verified: true };
    } else {
      throw new functions.https.HttpsError('permission-denied', 'Signature verification failed. Potential tampering detected.');
    }
  } catch (error) {
    console.error('Error verifying payment:', error);
    throw new functions.https.HttpsError('internal', error.message || 'Verification process failed');
  }
});
