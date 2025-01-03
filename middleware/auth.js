const jwt = require("jsonwebtoken");
const User = require("../models/userModel");
const { findUserById } = require("../services/userService");

const adminAuth = async(req, res, next) => {
    const tokenn = req.cookies.tokenn;
    if(!tokenn) {
        console.log("No tokenn.... auth failed");        
        return res.status(401).json({ error: 'Unauthorized...' });
    }
    try {
        const decoded = jwt.verify(tokenn, process.env.JWT_SECRET);
        // const user = await User.findById(decoded._id);
        const user = await findUserById(decoded._id);
        if(user.role === 'admin') {
            req.user = user;
            // console.log(`It\'s the ADMIN...............`, user._id);
            next();
        } else {
            console.log('Intruder trying to access ADMIN routes...............');
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } catch (error) {
        console.log("No tokenn.... auth failed", error);
        res.status(401).json({ error: 'Unauthorized', error });
    }
};


const commonAuth = async(req, res, next) => {
    const tokenn = req.cookies.tokenn;
    if(!tokenn) {
        console.log("No tokenn.... auth failed");
        return res.status(401).json({ error: 'Unauthorized...' });
    }
    try {
        const decoded = jwt.verify(tokenn, process.env.JWT_SECRET);
        const user = await findUserById(decoded._id);
        if(user.role === 'admin' || user.role === 'normalUser') {
            req.user = user;
            next();
        } else {
            console.log('Intruder trying to access COMMON routes...............');
            return res.status(401).json({ error: 'Unauthorized' });
        }
    } catch (error) {
        console.log("No tokenn.... auth failed", error);
        res.status(401).json({ error: 'Unauthorized', error });
    }
};


module.exports = { adminAuth, commonAuth };