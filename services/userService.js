const User = require("../models/userModel");

const findUserById = async(id) => {
    try {
        return await User.findById(id);
    } catch (error) {
        console.error("Error finding User by ID...............", error.message);
        throw new Error('Failed to find User by ID');
    }
};

const findUserByEmail = async(email) => {
    try {
        return await User.findOne({ email });
    } catch (error) {
        console.error("Error finding User by Email...............", error.message);
        throw new Error('Failed to find User by Email');
    }
}

module.exports = {
    findUserById,
    findUserByEmail
};