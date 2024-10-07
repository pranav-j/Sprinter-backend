const Joi = require('joi');
Joi.objectId = require('joi-objectid')(Joi);


const addMembersValidator = (req, res, next) => {
    const addMembersSchema = Joi.object({
        emails: Joi.array().items(Joi.string().email().required()).required(),
        currentProjectId: Joi.objectId().required()
    });
    const { error } = addMembersSchema.validate(req.body);
    if (error) {
        console.log("Add members validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Validation error', error: error.details[0].message });
    }
    next();
};

const createProjectValidator = (req, res, next) => {
    const createProjectSchema = Joi.object({
        title: Joi.string().max(30).required(),
        description: Joi.string().max(200).allow(''),
        startDate: Joi.date().allow('').optional(),
        endDate: Joi.date().allow('').optional(),
    });
    const { error } = createProjectSchema.validate(req.body);
    if(error) {
        console.log("Create project validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Project validation error', error: error.details[0].message });
    }
    next();
};

const createSprintValidator = (req, res, next) => {
    const createSprintSchema = Joi.object({
        sprintName: Joi.string().max(30).required(),
        description: Joi.string().max(200).allow('').optional(),
        durationInWeeks: Joi.number().max(4).required(),
        projectId: Joi.objectId().required()
    });
    const { error } = createSprintSchema.validate(req.body);
    if(error) {
        console.log("Create sprint validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Sprint validation error', error: error.details[0].message });
    }
    next();
};

const startSprintValidator = (req, res, next) => {
    const startSprintSchame = Joi.object({
        sprintId: Joi.objectId().required()
    });
    const { error } = startSprintSchame.validate(req.body);
    if(error) {
        console.log("Start sprint validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Start sprint validation error', error: error.details[0].message });
    }
    next();
};

const createItemValidator = (req, res, next) => {
    const createItemSchema = Joi.object({
        projectId: Joi.objectId().required(),
        title: Joi.string().max(30).required(),
        description: Joi.string().max(200).required(),
        type: Joi.string().valid('story', 'task', 'bug').required(),
        start: Joi.date().allow('').optional(),
        end: Joi.date().allow('').optional(),
        assignee: Joi.objectId().allow('').optional()
    });
    const { error } = createItemSchema.validate(req.body);
    if(error) {
        console.log("Create item validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Create item validation error', error: error.details[0].message });
    }
    next();
};

const addCommentValidator = (req,res, next) => {
    const addCommentSchema = Joi.object({
        comment: Joi.string().max(200).required(),
        itemId: Joi.objectId().required()
    });
    const { error } = addCommentSchema.validate(req.body);
    if(error) {
        console.log("Create item validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Create item validation error', error: error.details[0].message });
    }
    next();
};

const moveItemValidator = (req, res, next) => {
    const moveItemSchema = Joi.object({
        insertAt: Joi.number().required(),
        itemId: Joi.objectId().required(),
        itemSprintId: Joi.objectId().allow(null, '').optional(),
        moveToSprintId: Joi.objectId().allow(null, '').optional(),
        moveItemToBacklog: Joi.boolean().optional(),
        projectId: Joi.objectId().required(),
    });

    const { error } = moveItemSchema.validate(req.body);
    if (error) {
        console.log("Move item validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Move item validation error', error: error.details[0].message });
    }
    next();
};

const changeItemStatusValidator = (req, res, next) => {
    const changeItemStatusSchema = Joi.object({
        itemId: Joi.objectId().required(),
        statusId: Joi.number().valid(1, 2, 3).required(),
    });
    const { error } = changeItemStatusSchema.validate(req.body);
    if (error) {
        console.log("Change item status validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Change item status validation error', error: error.details[0].message });
    }
    next();
};

const signUpValidator = (req, res, next) => {
    const signUpSchema = Joi.object({
        firstName: Joi.string().min(1).max(5).required(),
        lastName: Joi.string().min(1).max(5).required(),
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    const { error } = signUpSchema.validate(req.body);
    if (error) {
        console.log("Signup validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Signup validation error', error: error.details[0].message });
    }
    next();
};

const inviteSignupValidator = (req, res, next) => {
    const inviteSignupSchema = Joi.object({
        firstName: Joi.string().min(1).max(5).required(),
        lastName: Joi.string().min(1).max(5).required(),
        email: Joi.string().email().required(),
        tempPassword: Joi.string().email().required(),
        newPassword: Joi.string().email().required(),
    });
    const { error } = inviteSignupSchema.validate(req.body);
    if (error) {
        console.log("Invite signup validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Invite signup validation error', error: error.details[0].message });
    }
    next();
};

const verifyOTPValidator = (req, res, next) => {
    const verifyOTPSchema = Joi.object({
        email: Joi.string().email().required(),
        otp: Joi.number().integer().min(100000).max(999999).required()
    });
    const { error } = verifyOTPSchema.validate(req.body);
    if (error) {
        console.log("OTP validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'OTP validation error', error: error.details[0].message });
    }
    next();
};

const loginValidator = (req, res, next) => {
    const loginSchema = Joi.object({
        email: Joi.string().email().required(),
        password: Joi.string().required()
    });
    const { error } = loginSchema.validate(req.body);
    if (error) {
        console.log("Login validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Login validation error', error: error.details[0].message });
    }
    next();
};

const deleteItemValidator = (req, res, next) => {
    const deleteItemSchema = Joi.object({
        id: Joi.objectId().required(),
    });
    const { error } = deleteItemSchema.validate(req.params);
    if (error) {
        console.log("Delete item validation error...............", error.details[0].message);        
        return res.status(400).json({ message: 'Delete item validation error', error: error.details[0].message });
    }
    next();
};


module.exports = {
    addMembersValidator,
    createProjectValidator,
    createSprintValidator,
    startSprintValidator,
    createItemValidator,
    addCommentValidator,
    moveItemValidator,
    changeItemStatusValidator,
    signUpValidator,
    inviteSignupValidator,
    verifyOTPValidator,
    loginValidator,
    deleteItemValidator
};