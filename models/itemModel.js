const mongoose = require("mongoose");

const attachmentSchema = mongoose.Schema({
    title: String,
    link: String,
    metadata: String,
    size: Number
});

const activityLogSchema = mongoose.Schema({
    changedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    change: String,
    changedAt: Date
});

const itemSchema = mongoose.Schema({
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    projectId: { type: mongoose.Schema.Types.ObjectId, ref: "Project", required: true },
    order: { type: Number },
    title: { type: String, required: true },
    description: String,
    type: { type: String, enum: ["story", "task", "bug"], required: true },
    attachments: [attachmentSchema],
    status: { type: String, enum: ["todo", "onGoing", "done"], default: "todo" },
    activityLog: [activityLogSchema],
    assignee: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    sprintId: { type: mongoose.Schema.Types.ObjectId, ref: "Sprint" },
    start: Date,
    end: Date,
    startedOn: Date,
    endedOn: Date
}, { timestamps: true });

const Item = mongoose.model('Item', itemSchema);
module.exports = Item;
