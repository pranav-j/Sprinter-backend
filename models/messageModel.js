const mongoose = require("mongoose");

const messageSchema = mongoose.Schema({
    messageContent: {
        type: String,
        required: true,
    },
    senderId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
    },
    receiverId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        // required: true,
    },
    projectId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
        // required: true,
    },
    projectGroupId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Project",
    },
    sentAt: {
        type: Date,
        default: Date.now,
    },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
module.exports = Message;
