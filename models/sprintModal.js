const mongoose = require('mongoose');

const sprintSchema = new mongoose.Schema({
    projectId: { 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'Project', 
        required: true 
    },
    sprintName: { 
        type: String, 
        required: true 
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true 
    },
    durationInWeeks: {
        type: Number,
        required: true
    },
    description: String,
    deletedAt: Date,
    startedOn: Date,
}, { timestamps: true });

const Sprint = mongoose.model('Sprint', sprintSchema);
module.exports = Sprint;
