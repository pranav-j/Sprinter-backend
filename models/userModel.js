const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const subscriptionSchema = mongoose.Schema({
    subscribedOn: Date,
    razorpay_order_id: String,
    razorpay_payment_id: String
})

const userSchema = new mongoose.Schema({
    firstName: {
        type: String,
        // required: true
    },
    lastName: {
        type: String,
        // required: true
    },
    email: {
        type: String,
        required: true,
        unique: true
    },
    password: {
        type: String,
        // required: true
    },
    profilePic: {
        type: String,
        default: ''
    },
    googleOAuthSub: {
        type: String
    },
    verified: {
        type: Boolean,
        default: false
    },
    role: {
        type: String,
        default: 'admin',
        required: true,
    },
    isSuspended: {
        type: Boolean,
        default: false
    },
    otp: {
        type: String,
    },
    addedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
    },
    projects: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project"
    }],
    subscription: subscriptionSchema
}, { timestamps: true });

userSchema.pre('save', async function(next) {
    if (!this.isModified('password')) return next();
    this.password = await bcrypt.hash(this.password, 12);
    next();
});

const User = mongoose.model('User', userSchema);
module.exports = User;
