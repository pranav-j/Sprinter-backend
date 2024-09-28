// might not be required once S3 is setup
const multer = require("multer");
const imgUploads = multer();
// ---------------------------------------

const crypto = require("crypto");
const bcrypt = require('bcryptjs');
const jwt = require("jsonwebtoken");
const { transporter } = require("../services/mailer")

const { uploadFileToS3 } = require("../services/s3Upload")

const User = require("../models/userModel")
const Project = require("../models/projectModel")
const Sprint = require("../models/sprintModal")

const home = async(req, res) => {
    return res.status(200).json({message: 'Lets gooooooo......'});
};

// const signUp = async(req, res) => {

//     imgUploads.none()(req, res, async (err) => {
//         if (err) {
//           return res.status(500).json({ error: 'Failed to upload' });
//         }
    
//         const { firstName, lastName, email, password } = req.body;
//         try {
//             console.log(req.body);

//             const existingUser = await User.findOne({ email });
//             if (existingUser) return res.status(400).json({ error: 'Email already in use' });

//             const otp = crypto.randomInt(100000, 999999).toString();

//             const newUser = new User({ firstName, lastName, email, password, otp });

//             const mailOptions = {
//                 from: process.env.EMAIL_USERNAME,
//                 to: email,
//                 subject: 'SPRINTER email verification',
//                 text: `Your OTP for email verification is: ${otp}`
//             };

//             transporter.sendMail(mailOptions, function (error, info) {
//                 if (error) {
//                     console.log('Error sending email: ', error);
//                 } else {
//                     console.log('Email sent: ' + info.response);
//                 }
//             });

//             const newUserCreated = await newUser.save();
//             if(newUserCreated) console.log('User created but to be verified...............');

//             res.status(200).json({ message: 'User created successfully but to be verified' });
//         } catch (error) {
//             console.log('Error creating user:', error);
//             res.status(500).json({ error: 'Failed to create user' });
//         }
//       });
// };

const signUp = async(req, res) => {    
    const { firstName, lastName, email, password } = req.body;
    try {
        console.log(req.body);

        const existingUser = await User.findOne({ email });
        if (existingUser) return res.status(400).json({ error: 'Email already in use' });

        let profilePicUrl = '';

        if(req.file) {
            profilePicUrl = await uploadFileToS3(req.file, 'profile-pics');
        }

        const otp = crypto.randomInt(100000, 999999).toString();

        const newUser = new User({ firstName, lastName, email, password, otp, profilePic: profilePicUrl });

        const mailOptions = {
            from: process.env.EMAIL_USERNAME,
            to: email,
            subject: 'SPRINTER email verification',
            text: `Your OTP for email verification is: ${otp}`
        };

        transporter.sendMail(mailOptions, function (error, info) {
            if (error) {
                console.log('Error sending email: ', error);
            } else {
                console.log('Email sent: ' + info.response);
            }
        });

        const newUserCreated = await newUser.save();
        if(newUserCreated) console.log('User created but to be verified...............');

        res.status(200).json({ message: 'User created successfully but to be verified' });
    } catch (error) {
        console.log('Error creating user:', error);
        res.status(500).json({ error: 'Failed to create user' });
    }
};

const verifyOTP = async(req, res) => {
    try {
        const { email, otp } = req.body;

        const user = await User.findOne({ email });

        console.log("USER FOUND FOR VERIFICATION........", user);
        if( !user || user.otp != otp) return res.status(400).send('Invalid OTP.');

        user.verified = true;
        user.otp = undefined;
        const OTPverified = await user.save();

        if(OTPverified) {
            console.log('OTP verified...............');
            res.status(200).json({ message: 'User created successfully but to be verified' });
        } else {
            res.status(500).json({ message: "OTP varification failed"})
        }
    } catch (error) {
        console.log("OTP varification failed...............", error.message);
        res.status(500).json({ error: error.message });
    }
};

const login = async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = await User.findOne({ email });

        if(!user || !(await bcrypt.compare(password, user.password))) {
            return res.status(401).json({
                status: 'failed',
                message: 'You must verify your email before logging in.'
            })
        };

        if(!user.verified) {
            console.log('User yet to be verified...............');
            return res.status(401).json({
                status: 'failed',
                message: 'You must verify your email before logging in.'
            });
        };

        if(user) console.log("User found to be logged in...............", user._id);

        const tokenn = jwt.sign(
            { 
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '10h'
            }
        );
        console.log(`${user.firstName} ${user.lastName} logged in...............`);
        res.cookie('tokenn', tokenn, { httpOnly: true });

        res.status(200).json({
            status: 'success',
            tokenn,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePic: user.profilePic,
                role: user.role
            }
        });


    } catch (error) {
        console.log("Failed to login...............", error.message);
        res.status(500).json({ 
            message: 'Error logging in user',
            error: error.message
        });
    }
};

const logout = (req, res) => {
    res.clearCookie('tokenn');
    res.status(200).json({ message: 'Logged out successfully' });
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
                console.log(`User alfeady exist for ${email}...............`);
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

        // const project = await Project.findById(sprint.projectId);
        // const members = await User.find({projects: project._id});

        // console.log("EMAILS.......", members);

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
            // console.log(`Email: ${member.email}, First Name: ${member.firstName}, Last Name: ${member.lastName}`);

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
        return res.status(500).json({ message: "Failed to start sprint" });
    }
};

module.exports = {
    home,
    signUp,
    verifyOTP,
    login,
    logout,
    createProject,
    getProjects,
    createSprint,
    getSprints,
    addMembers,
    getMembers,
    startSprint
};