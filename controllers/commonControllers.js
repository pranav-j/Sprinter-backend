const Item = require("../models/itemModel");
const { findItemById } = require("../services/itemService");
const { uploadFileToS3 } = require("../services/s3Upload");

const moveItem = async(req, res) => {
    console.log('TEST.........', req.body);
    const { insertAt, itemId, itemSprintId, moveToSprintId, moveItemToBacklog, projectId } = req.body;

    try {
        const item = await findItemById(itemId);
        const moveToSprintItems = await Item.find({ projectId: projectId, sprintId: moveToSprintId}).sort('order');
        const itemsInBacklog = await Item.find({ projectId: projectId, sprintId: null }).sort('order');

        // console.log("moveToSprintItems............", moveToSprintItems);
    
        if(moveToSprintId && !itemSprintId) {
            console.log("Move item from Backlog to Sprint");
            if(insertAt === 0) {
                item.sprintId = moveToSprintId;
                item.order = 1;
                await item.save();
    
                // increment the order of the rest by 1 since the new one is added at the top.
                for(let i = 0; i < moveToSprintItems.length; i++) {
                    moveToSprintItems[i].order = moveToSprintItems[i].order + 1;
                    await moveToSprintItems[i].save();
                }
    
            } else {
                // starts at "insertAt - 1" because array index starts at 0 and order starts at 1.
                for(let i = insertAt - 1; i < moveToSprintItems.length; i++) {
                    if(i === insertAt - 1) {
                        item.sprintId = moveToSprintId;
                        item.order = insertAt + 1;
                        await item.save();
                    };
                    if(i > insertAt - 1) {
                        // increment the order of items after the one inserted
                        moveToSprintItems[i].order = moveToSprintItems[i].order + 1;
                        await moveToSprintItems[i].save();
                    }
                }
    
            }
    
    
        };
        if((moveToSprintId && itemSprintId) && (moveToSprintId != itemSprintId)) {
            console.log("Move item between Sprints");
            if(insertAt === 0) {
                item.sprintId = moveToSprintId;
                item.order = 1;
                await item.save();
    
                // increment the order of the rest by 1 since the new one is added at the top.
                for(let i = 0; i < moveToSprintItems.length; i++) {
                    moveToSprintItems[i].order = moveToSprintItems[i].order + 1;
                    await moveToSprintItems[i].save();
                }
                // reset the order of items in the sprint that it was moved from
                const movedFromSprintItems = await Item.find({ projectId: projectId, sprintId: itemSprintId}).sort('order');
                for(let i = 0; i < movedFromSprintItems.length; i++) {
                    movedFromSprintItems[i].order = i + 1;
                    await movedFromSprintItems[i].save();
                }
            }
            else {
                item.sprintId = moveToSprintId;
                item.order = insertAt + 1;
                await item.save();

                for(let i = insertAt; i < moveToSprintItems.length; i++) {
                    // increment the order of items after the one inserted
                    moveToSprintItems[i].order = moveToSprintItems[i].order + 1;
                    await moveToSprintItems[i].save();
                }
                const movedFromSprintItems = await Item.find({ projectId: projectId, sprintId: itemSprintId}).sort('order');
                for(let i = 0; i < movedFromSprintItems.length; i++) {
                    movedFromSprintItems[i].order = i + 1;
                    await movedFromSprintItems[i].save();
                }
            }
    
        };
        if(moveToSprintId === itemSprintId) {
            console.log("Re-order items in a Sprint");

            for(let i = insertAt; i <= item.order - 1; i++) {
                moveToSprintItems[i].order = moveToSprintItems[i].order + 1;
                await moveToSprintItems[i].save();
            }

            item.order = insertAt + 1;
            await item.save();
        }
        if(moveItemToBacklog) {
            console.log("Move item back to Backlog");
            item.sprintId = undefined;
            item.order = insertAt + 1;
            await item.save();

            for(let i = insertAt; i < itemsInBacklog.length; i++) {
                itemsInBacklog[i].order = itemsInBacklog[i].order + 1;
                await itemsInBacklog[i].save();
            }

            const movedFromSprintItems = await Item.find({ projectId: projectId, sprintId: itemSprintId}).sort('order');
            for(let i = 0; i < movedFromSprintItems.length; i++) {
                movedFromSprintItems[i].order = i + 1;
                await movedFromSprintItems[i].save();
            }
        };
    

        for(let i = 0; i < itemsInBacklog.length; i++) {
            itemsInBacklog[i].order = i + 1;
            await itemsInBacklog[i].save();
        }

        const updatedOrder = await Item.find(
            { projectId },
            { _id: 1, order: 1 }
        )

        res.status(200).json({
            message: "Item moved succesfully",
            updatedItem: item,
            updatedOrder
        })
    } catch (error) {
        console.log("Failed moving item...............", error.message);
        return res.status(500).json({ message: "Failed moving item" });
    }

};

const createItem = async(req, res) => {
    try {
        const user = req.user;
        const { projectId, title, description, type, start, end, assignee } = req.body;

        const itemCount = await Item.countDocuments({ projectId, sprintId: null });
        console.log("itemCount.........", itemCount);
        console.log("ITEM.........", req.body);

        const newItem = new Item({
            createdBy: user._id,
            projectId,
            title,
            description,
            type,
            start,
            end,
            order: itemCount + 1,
            assignee: assignee === '' ? null : (assignee || null),
            attachments: []
        });

        if(req.files && req.files.length > 0) {
            console.log("Files in new Item........", req.files);
            for ( const file of req.files) {
                const fileUrl = await uploadFileToS3(file, 'item-files');

                newItem.attachments.push({
                    title: file.originalname,
                    link: fileUrl,
                    metadata: file.mimetype,
                    size: file.size,
                });
            }
        };

        if(req.user.role === 'admin' && assignee) {
            newItem.activityLog.push({
                changedBy: req.user._id,
                change: `"${title}" assigned to ${assignee}`,
                changedAt: new Date(),
            }, { new: true });
        }

        const newItemCreated = await newItem.save();
        if(newItemCreated) console.log('New item created...............');
        res.status(200).json(newItemCreated);
    } catch (error) {
        console.log("Failed to create item...............", error.message);
        return res.status(500).json({ message: "Failed to create item" });
    }
};

const updateItem = async(req, res) => {
    try {
        const { id } = req.params;
        const { title, description, type, start, end, assignee } = req.body;

        // const updatedItem = await Item.findByIdAndUpdate(
        //     id,
        //     {
        //         title,
        //         description,
        //         type,
        //         start,
        //         end,
        //         assignee: assignee === '' ? null : (assignee || null),
        //     },
        //     { new: true }
        // );

        const updatedFields = {
            title,
            description,
            type,
            start,
            end,
            assignee: assignee === '' ? null : (assignee || null),
        };

        let updatedItem = await Item.findByIdAndUpdate(
            id,
            updatedFields,
            { new: true }
        );

        // If only assignee is updated, log it in the activity log
        if (assignee && !title && !description && !type && !start && !end) {
            updatedItem.activityLog.push({
                changedBy: req.user._id,
                change: `"${updatedItem.title}" taken up by ${req.user.firstName} ${req.user.lastName}`,
                changedAt: new Date(),
            }, { new: true });
            updatedItem = await updatedItem.save();
        }

        if (updatedItem) {
            console.log(`${id} updated by ${req.user._id}...............`);
            return res.status(200).json(updatedItem);
        } else {
            return res.status(404).json({ message: "Item not found" });
        }
    } catch (error) {
        console.log("Failed to update item...............", error.message);
        return res.status(500).json({ message: "Failed to update item" });
    }
};

const deleteItem = async(req,res) => {
    try {
        const item = await findItemById(req.params.id);
        if(item.createdBy === req.user._id || req.user.role === 'admin') {
            await Item.findByIdAndDelete(req.params.id);
            console.log(`${req.params.id} DELETED by ${req.user._id}...............`);
            res.status(200).json({ message: 'Item deleted successfully', itemId: req.params.id });
        } else {
            return res.status(403).json({ message: "Unauthorized" });
        }
    } catch (error) {
        console.log("Failed to delete item...............", error.message);
        res.status(500).json({ message: 'Failed to delete item', error });
    }
};

const addComment = async(req, res) => {
    try {
        const { comment, itemId } = req.body;

        const item = await findItemById(itemId);


        if (!item) {
            return res.status(404).json({ message: "Item not found" });
        }

        item.comments.push({
            commentedBy: req.user._id,
            content: comment,
            commentedAt: new Date(),
        });

        await item.save();
        console.log("Comment made successfully...............");
        
        return res.status(200).json(item);

    } catch (error) {
        console.log("Failed to add comment...............", error.message);
        return res.status(500).json({ message: "Failed to add comment" });
    }
};

const getItem = async(req, res) => {
    const { projectId } = req.query;
    try {
        const items = await Item.find({projectId});
        console.log(`Items fetched for project ${projectId}...............`);
        return res.status(200).json({ items });
    } catch (error) {
        console.log("Failed to fetch items...............", error.message);
        return res.status(500).json({ message: "Failed to fetch items" });
    }
};

const changeItemStatus = async(req, res) => {
    const { itemId, statusId } = req.body;
    try {
        let newStatue;
        switch (statusId) {
            case 1:
                newStatue = "todo"
                break;
            case 2:

                newStatue = "onGoing";
                break;
            case 3:
                newStatue = "done";
                break;
            default:
                return res.status(400).json({ message: "Invalid status value" });
        }
        
        const updatedItem = await Item.findByIdAndUpdate(
            itemId,
            { status: newStatue },
            { new: true }
        );

        console.log("updatedItem............", updatedItem);

        if(!updatedItem) {
            return res.status(404).json({ message: "Item not found" });
        };


        console.log(`Change ${itemId} ${newStatue}...............`);
        res.status(200).json({ message: "Status changed" , updatedItem});
    } catch (error) {
        console.log("Failed to change status...............", error.message);
        return res.status(500).json({ message: "Failed to change status", error });
    }
};

module.exports = {
    createItem,
    updateItem,
    deleteItem,
    addComment,
    getItem,
    moveItem,
    changeItemStatus
};