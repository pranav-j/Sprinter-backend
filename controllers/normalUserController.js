const bcrypt = require("bcryptjs");
const User = require("../models/userModel");
const { uploadFileToS3 }  = require("../services/s3Upload")

const inviteSignup = async(req, res) => {
    const { firstName, lastName, email, tempPassword, newPassword } =req.body;
    try {
        const user = await User.findOne({ email });

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
}

module.exports = {
    inviteSignup,
};