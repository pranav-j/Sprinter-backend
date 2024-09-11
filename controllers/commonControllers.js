const Item = require("../models/itemModel");
const { uploadFileToS3 } = require("../services/s3Upload")

const moveItem = async(req, res) => {
    console.log('TEST.........', req.body);
    const { insertAt, itemId, itemSprintId, moveToSprintId, moveItemToBacklog, projectId } = req.body;

    try {
        const item = await Item.findById(itemId);
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
        res.status(200).json({message: 'yoo boy'})
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
        console.log("Item to UPDATE........", req.body);
    } catch (error) {
        console.log("Failed to update item...............", error.message);
        return res.status(500).json({ message: "Failed to update item" });
    }
}

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
        return res.status(500).json({ message: "Failed to change status" });
    }
};

module.exports = {
    createItem,
    updateItem,
    getItem,
    moveItem,
    changeItemStatus
};