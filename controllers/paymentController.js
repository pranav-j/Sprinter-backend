const crypto = require('crypto');
const Razorpay = require('razorpay');
const User = require("../models/userModel");


const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET,
});


const createOrder = async (req, res) => {
    try {
        const { amount, receipt } = req.body;

        const options = {
            amount: amount * 100, // Convert amount to paise
            currency: "INR",
            receipt
        };

        const order = await razorpay.orders.create(options);
        console.log("Order created:", order);

        await User.findByIdAndUpdate(req.user._id, {
            subscription: {
                subscribedOn: new Date(),
                razorpay_order_id: order.id,
                razorpay_payment_id: null  // Payment ID is null initially
            }
        });

        return res.status(200).json(order);
    } catch (error) {
        console.error("Error creating order:", error);
        res.status(500).send('Error creating order');
    }
};

// Route to verify the payment
const verifyPayment = async (req, res) => {
    const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;
    console.log("Payment response received:", { razorpay_order_id, razorpay_payment_id, razorpay_signature });

    try {
        const generatedSignature = crypto
            .createHmac('sha256', razorpay.key_secret)
            .update(`${razorpay_order_id}|${razorpay_payment_id}`)
            .digest('hex');

        if (generatedSignature === razorpay_signature) {

            // Find the user and update the subscription status to 'paid'
            const user = await User.findById(req.user._id);

            if (user && user.subscription && user.subscription.razorpay_order_id === razorpay_order_id) {
                user.subscription.razorpay_payment_id = razorpay_payment_id;
                await user.save();

                console.log("Payment verification successful for order:", razorpay_order_id);
                return res.status(200).json({ status: 'ok' });
            } else {
                console.error("Order not found for verification.");
                return res.status(404).json({ status: 'not_found', message: 'Order not found' });
            }
        } else {
            console.error("Payment verification failed: Signature mismatch");
            return res.status(400).json({ status: 'verification_failed', message: 'Signature mismatch' });
        }
    } catch (error) {
        console.error("Error during payment verification:", error);
        return res.status(500).json({ status: 'error', message: 'Error verifying payment' });
    }
};

module.exports = {
    createOrder,
    verifyPayment
};