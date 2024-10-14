const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { uploadFileToS3 }  = require("../services/s3Upload");
const { findUserByEmail } = require("../services/userService");

const jwt = require("jsonwebtoken");

// MEMBER Signup---------------------------------------------------------------------------

const inviteSignup = async(req, res) => {
    const { firstName, lastName, email, tempPassword, newPassword } =req.body;
    try {
        const user = await findUserByEmail(email);

        if(!user) {
            res.status(404).json({ message: 'User not found' });
        };

        let profilePicUrl = '';

        if(req.file) {
            profilePicUrl = await uploadFileToS3(req.file, 'profile-pics');
        }

        const isTempPassValid = await bcrypt.compare(tempPassword, user.password);

        if(!isTempPassValid) {
            return res.status(401).json({ message: 'Invalid invite password' });
        };

        user.password = newPassword;
        user.firstName = firstName;
        user.lastName = lastName;
        user.verified = true;
        user.profilePic = profilePicUrl;

        await user.save();

        console.log("INVITE SIGNUP.........", req.body);
        res.status(200).json({ message: "Invitee signup succesfull"})
    } catch (error) {
        console.log('Error signing up invited user:', error);
        res.status(500).json({ error: 'Failed to signup invited user' });
    }
};

// ADMIN Signup---------------------------------------------------------------------------

const signUp = async(req, res) => {    
    const { firstName, lastName, email, password } = req.body;
    try {
        console.log(req.body);

        const existingUser = await findUserByEmail(email);
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

        const user = await findUserByEmail(email);

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

// Common Login/Logout---------------------------------------------------------------------

const login = async(req, res) => {
    try {
        const { email, password } = req.body;
        const user = await findUserByEmail(email);

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
            },
            process.env.JWT_SECRET,
            {
                expiresIn: '24h'
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

// Google OAuth-----------------------------------------------------------------------------------

const googleOAuth = async(req, res) => {
    try {
        const {credential, clientId} = req.body;
        const {email, name, picture, sub} = jwt.decode(credential);
        console.log("OAuth body", {email, name, picture, sub});
        const user = await findUserByEmail(email);

        if(user && user.email && !user.googleOAuthSub) {
            console.log("User exists and signed up without OAuth........");
            return res.status(409).json({ message: 'Please sign in with email and password' });
        } else if(user && user.email && user.googleOAuthSub) {
            console.log("User signed up with OAuth........");
            const tokenn = jwt.sign(
                { _id: user._id },
                process.env.JWT_SECRET,
                { expiresIn: '24h' }
            );
            console.log(`${user.firstName} ${user.lastName} logged in...............`);
            res.cookie('tokenn', tokenn, { httpOnly: true });
            return res.status(200).json({
            tokenn,
            user: {
                _id: user._id,
                firstName: user.firstName,
                lastName: user.lastName,
                profilePic: user.profilePic,
                role: user.role
            }
            });
        } else if(!user){
            console.log("Sign up with OAuth........");

            console.log("OAuth body", {email, name, picture, sub});
            
            const newUser = new User({ 
                firstName: name,
                email,
                profilePic: picture,
                googleOAuthSub: sub,
            });
            

            const newUserCreated = await newUser.save();

            console.log("New user created succesfully using OAuth...............");                

            const tokenn = jwt.sign(
                { 
                    _id: newUserCreated._id,
                },
                process.env.JWT_SECRET,
                {
                    expiresIn: '24h'
                }
            );
            console.log(`${newUserCreated.firstName} ${newUserCreated.lastName} logged in...............`);
            res.cookie('tokenn', tokenn, { httpOnly: true });
    
            return res.status(200).json({
                tokenn,
                user: {
                    _id: newUserCreated._id,
                    firstName: newUserCreated.firstName,
                    lastName: newUserCreated.lastName,
                    profilePic: newUserCreated.profilePic,
                    role: newUserCreated.role
                }
            });
        }
        
        res.status(200).json({ message: 'OAuth verified successfully' });
    } catch (error) {
        console.log("OAuth failed...............", error.message);
        res.status(500).json({ 
            message: 'OAuth failed',
            error: error.message
        });
    }
};

module.exports = {
    inviteSignup,
    signUp,
    verifyOTP,
    login,
    logout,
    googleOAuth
};