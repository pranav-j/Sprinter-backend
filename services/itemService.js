const Item = require("../models/itemModel")


const findItemById = async(id) => {
    try {
        return await Item.findById(id);
    } catch (error) {
        console.error("Error finding item by ID...............", error.message);
        throw new Error('Failed to find item by ID');
    }
};


module.exports = {
    findItemById,
}