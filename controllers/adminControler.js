// might not be required once S3 is setup
const multer = require("multer");
const imgUploads = multer();
// ---------------------------------------

const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const { transporter } = require("../services/mailer");
const mongoose = require("mongoose");
const Item = require("../models/itemModel");

const { uploadFileToS3 } = require("../services/s3Upload")

const User = require("../models/userModel")
const Project = require("../models/projectModel")
const Sprint = require("../models/sprintModal")

const home = async(req, res) => {
    return res.status(200).json({message: 'Lets gooooooo......'});
};






// PROJECT --------------------------------------------------------------------------------------------------

const createProject = async(req, res) => {
    const { title, description, startDate, endDate } = req.body;
    const user = req.user;
    try {
        const newProject = new Project({ 
            title, 
            description, 
            createdBy: user._id,
            startDate,
            endDate,
        });
        const newProjectCreated = await newProject.save();
        if(newProjectCreated) console.log('New project created...............');

        res.status(200).json(newProjectCreated);
        // res.status(200).json({ message: 'New project created' });
    } catch (error) {
        console.log("Failed to create project...............", error.message);
        return res.status(500).json({ message: "Failed to create project" });
    }
};

const getProjects = async(req, res) => {
    try {
        let projects;
        if(req.user.role === "admin") {
            projects = await Project.find({ createdBy: req.user._id});
        }
        else if(req.user.role === "normalUser") {
            projects = await Project.find({ _id: { $in: req.user.projects } });
        }
        console.log("Projects fetched...............");
        return res.status(200).json({ projects });
    } catch (error) {
        console.log("Failed to fetch projects...............", error.message);
        return res.status(500).json({ message: "Failed to fetch projects" });
    }
};


// SPRINT --------------------------------------------------------------------------------------------------

const createSprint = async(req, res) => {
    const { sprintName, description, durationInWeeks, projectId } = req.body;
    try {
        const newSprint = new Sprint({
            sprintName,
            description, 
            durationInWeeks, 
            projectId,
            createdBy: req.user._id
        })
        const newSprintCreated = await newSprint.save();
        if(newSprintCreated) console.log('New sprint created...............');
        res.status(200).json(newSprintCreated);
    } catch (error) {
        console.log("Failed to create sprint...............", error.message);
        return res.status(500).json({ message: "Failed to create sprint" });
    }
};

const endSprint = async(req, res) => {
    const { sprintId } = req.body;
    try {
        console.log("Let's start this SPRINT ", sprintId);
        
        const sprint = await Sprint.findByIdAndUpdate(
            sprintId,
            { endedOn: new Date() },
            { new: true }
        );

        if (!sprint) {
            return res.status(404).json({ message: "Sprint not found" });
        }
        console.log("Sprint ended succesfully...............", sprintId);
        res.status(200).json({ message: `Sprint ${sprintId} ended`, sprint });
    } catch (error) {
        console.log("Error updating sprint to \"Finished\"...............", error.message);
        return res.status(500).json({ message: "Failed to create sprint" });
    }
};

const getSprints = async(req, res) => {
    const { projectId } = req.query;
    try {
        const sprints = await Sprint.find({ projectId });
        console.log("Projects fetched...............");
        return res.status(200).json({ sprints });
    } catch (error) {
        console.log("Failed to fetch projects...............", error.message);
        return res.status(500).json({ message: "Failed to fetch projects" });
    }
};

const addMembers = async(req, res) => {
    try {
        const { emails, currentProjectId } = req.body;
        for(const email of emails) {
            

            const existingUser = await User.findOne({ email });

            if(existingUser) {
                console.log(`User already exist for ${email}...............`);
                continue;
            }

            const randomPassword = crypto.randomBytes(8).toString('hex');
            const newMember = new User({ 
                email, 
                password: randomPassword, 
                role: 'normalUser',
                addedBy: req.user._id,
                projects: [ currentProjectId ]
            });
            await newMember.save();

            console.log(`Invite sent to ' ${email} ' with PASS ${randomPassword}...............`);

            const inviteLink = "http://localhost:3000/inviteSignup";

            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: email,
                subject: 'SPRINTER invitation',
                text: `Welcome to Sprinter. You have been invited to SPRINTER by ${req.user.firstName} ${req.user.lastName}. Please follow this link (${inviteLink}) and use this password (${randomPassword}) to accept the invite. 😁`
            };

            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log('Error sending email: ', error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        };
        console.log("Members added succesfully...............");
        res.status(200).json({ message: "Members added succesfully"})
    } catch (error) {
        console.log("Failed to add members...............", error.message);
        return res.status(500).json({ message: "Failed to add members" });
    }
};

const getMembers = async(req, res) => {
    const { projectId } = req.query;
    try {
        const members = await User.find({ 
            projects: projectId,
        }).select('-password -createdAt -updatedAt');

        if (req.user.addedBy) {
            const addedByUser = await User.findById(req.user.addedBy).select('-password -createdAt -updatedAt');
            if (addedByUser) {
                members.push(addedByUser);
            }
        }
        console.log("Members fetched succesfully...............");
        res.status(200).json(members);
    } catch (error) {
        console.log("Failed to find members...............", error.message);
        return res.status(500).json({ message: "Failed to find members" });
    }
};

const startSprint = async(req, res) => {
    const { sprintId } = req.body;
    try {
        console.log("Let's start this SPRINT ", sprintId);
        
        const sprint = await Sprint.findByIdAndUpdate(
            sprintId,
            { startedOn: new Date() },
            { new: true }
        );

        if (!sprint) {
            return res.status(404).json({ message: "Sprint not found" });
        }

        const projectWithMembers = await Project.aggregate([
            { $match: { _id: sprint.projectId } }, // Match the project by ID
            {
              $lookup: {
                from: 'users', // The name of the User collection
                localField: '_id', // Field from the Project collection
                foreignField: 'projects', // Field from the User collection
                as: 'members' // Name of the output array field
              }
            },
            {
              $project: {
                members: {
                  $map: {
                    input: '$members',
                    as: 'member',
                    in: {
                      email: '$$member.email',
                      firstName: '$$member.firstName',
                      lastName: '$$member.lastName'
                    }
                  }
                }
              }
            }
        ]);

        const members = projectWithMembers[0]?.members || [];
          
        members.forEach(member => {
            const mailOptions = {
                from: process.env.EMAIL_USERNAME,
                to: member.email,
                subject: 'SPRINT STARTED',
                text: `Hello, ${member.firstName}, New SPRINT started by ${req.user.firstName} ${req.user.lastName}. 🧑‍💻`
            };
    
            transporter.sendMail(mailOptions, function (error, info) {
                if (error) {
                    console.log('Error sending email: ', error);
                } else {
                    console.log('Email sent: ' + info.response);
                }
            });
        });

        console.log("Sprint started succesfully...............", sprintId);
        res.status(200).json({ message: `Sprint ${sprintId} started`, sprint });
    } catch (error) {
        console.log("Failed to start sprint...............", error.message);
        return res.status(500).json({ message: "Failed to start sprint", error });
    }
};


// FOR REFERENCE --- no lookup
// const getReportStats = async (req, res) => {
//     try {
//         console.log("getReportStats......");

//         const { projectId } = req.query;

//         const result = await Item.aggregate([
//             // Stage 1: Filter items that have a sprintId
//             {
//                 $match: { 
//                     projectId: new mongoose.Types.ObjectId(projectId),
//                     sprintId: { $exists: true, $ne: null },
//                 }
//             },
//             // Stage 2: Group by sprintId and calculate counts
//             {
//                 $group: {
//                     _id: "$sprintId", // Group by sprintId
//                     totalItems: { $sum: 1 }, // Count total items in each sprint
//                     todoCount: {
//                         $sum: {
//                             $cond: [{ $eq: ["$status", "todo"] }, 1, 0]
//                         }
//                     },
//                     onGoingCount: {
//                         $sum: {
//                             $cond: [{ $eq: ["$status", "onGoing"] }, 1, 0]
//                         }
//                     },
//                     doneCount: {
//                         $sum: {
//                             $cond: [{ $eq: ["$status", "done"] }, 1, 0]
//                         }
//                     }
//                 }
//             }
//         ]);

//         console.log(result);

//         res.status(200).json(result);
//     } catch (error) {
//         console.error("Error while grouping items by sprint: ", error);
//     }
// };

const getReportStats = async (req, res) => {
    try {
        console.log("getReportStats......");

        const { projectId } = req.query;

        const result = await Item.aggregate([
            // Stage 1: Filter items by projectId and those with a sprintId
            {
                $match: {
                    projectId: new mongoose.Types.ObjectId(projectId),
                    sprintId: { $exists: true, $ne: null }
                }
            },
            // Stage 2: Lookup the Sprint collection to include the startedOn field
            {
                $lookup: {
                    from: "sprints",  // Name of the collection (make sure it's correct)
                    localField: "sprintId", // Field in the Item collection that refers to Sprint
                    foreignField: "_id", // Field in the Sprint collection
                    as: "sprintDetails"  // Alias for the joined data
                }
            },
            // Stage 3: Unwind the "sprintDetails" array to work with individual sprint documents
            {
                $unwind: {
                    path: "$sprintDetails",
                    preserveNullAndEmptyArrays: false // Only keep items with a matching sprint
                }
            },
            // Stage 4: Filter only sprints that have a "startedOn" field
            {
                $match: {
                    "sprintDetails.startedOn": { $exists: true, $ne: null }
                }
            },
            // Stage 5: Group by sprintId and calculate counts
            {
                $group: {
                    _id: "$sprintId", // Group by sprintId
                    totalItems: { $sum: 1 }, // Count total items in each sprint
                    todoCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "todo"] }, 1, 0]
                        }
                    },
                    onGoingCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "onGoing"] }, 1, 0]
                        }
                    },
                    doneCount: {
                        $sum: {
                            $cond: [{ $eq: ["$status", "done"] }, 1, 0]
                        }
                    }
                }
            }
        ]);

        console.log(result);

        res.status(200).json(result);
    } catch (error) {
        console.error("Error while grouping items by sprint: ", error);
        res.status(500).json({ message: "Failed to fetch report stats" });
    }
};


module.exports = {
    home,
    createProject,
    getProjects,
    createSprint,
    endSprint,
    getSprints,
    addMembers,
    getMembers,
    startSprint,
    getReportStats
};