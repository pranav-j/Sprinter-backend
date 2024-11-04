require("dotenv").config();
require("./config/bdConfig");

const express = require('express');
const cookieParser = require('cookie-parser');
const http = require('http');
const cors = require('cors');
const crypto = require('crypto');
const bodyParser = require('body-parser');
const routes = require("./routes/router");
const initSocket = require('./socket')

const Razorpay = require('razorpay');
const { validateWebhookSignature } = require('razorpay/dist/utils/razorpay-utils');

const app = express();

const server = http.createServer(app);

app.use(express.json());

app.use(cookieParser());

app.use(bodyParser.json());

app.use(bodyParser.urlencoded({ extended: true }));

app.use(cors({ 
    origin: process.env.FRONTEND_URL,
    credentials: true 
}));


app.use(routes);

initSocket(server);

const PORT = process.env.PORT;

// -------------------------------------------------------------------------

// const razorpay = new Razorpay({
//     key_id: process.env.RAZORPAY_KEY_ID,
//     key_secret: process.env.RAZORPAY_KEY_SECRET,
// });

// let orderStore = {};

// // Route to create an order
// app.post('/api/create-order', async (req, res) => {
//     try {
//         const { amount, receipt } = req.body;

//         const options = {
//             amount: amount * 100, // Convert amount to paise
//             currency: "INR",
//             receipt
//         };

//         const order = await razorpay.orders.create(options);
//         console.log("Order created:", order);

//         // Save the order to in-memory storage
//         orderStore[order.id] = {
//             amount: order.amount,
//             currency: order.currency,
//             receipt: order.receipt,
//             status: 'created'
//         };

//         res.status(200).json(order);
//     } catch (error) {
//         console.error("Error creating order:", error);
//         res.status(500).send('Error creating order');
//     }
// });

// // Route to verify the payment
// app.post('/api/verify-payment', async (req, res) => {
//     const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
//     console.log("Payment response received:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });

//     try {
//         const generatedSignature = crypto
//             .createHmac('sha256', razorpay.key_secret)
//             .update(`${razorpay_order_id}|${razorpay_payment_id}`)
//             .digest('hex');

//         if (generatedSignature === razorpay_signature) {
//             if (orderStore[razorpay_order_id]) {
//                 // Update the in-memory order status to 'paid'
//                 orderStore[razorpay_order_id].status = 'paid';
//                 orderStore[razorpay_order_id].payment_id = razorpay_payment_id;

//                 console.log("Payment verification successful for order:", razorpay_order_id);
//                 res.status(200).json({ status: 'ok' });
//             } else {
//                 console.error("Order not found in memory for verification.");
//                 res.status(404).json({ status: 'not_found', message: 'Order not found' });
//             }
//         } else {
//             console.error("Payment verification failed: Signature mismatch");
//             res.status(400).json({ status: 'verification_failed', message: 'Signature mismatch' });
//         }
//     } catch (error) {
//         console.error("Error during payment verification:", error);
//         res.status(500).json({ status: 'error', message: 'Error verifying payment' });
//     }
// });

// -------------------------------------------------------------------------

server.listen(PORT, () => {
    console.log("Server running on..............", PORT);
});