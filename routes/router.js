const express = require('express');
const router = express.Router();

const { adminAuth, commonAuth } = require("../middleware/auth");

const { createOrder, verifyPayment } = require("../controllers/paymentController");

const { 
    createProject, 
    getProjects, 
    createSprint, 
    getSprints, 
    addMembers, 
    getMembers, 
    startSprint 
} = require("../controllers/adminControler");

const { 
    createItem, 
    updateItem, 
    deleteItem,
    addComment, 
    getItem, 
    moveItem, 
    changeItemStatus
} = require("../controllers/commonControllers");

const { 
    inviteSignup,
    signUp,
    verifyOTP,
    login,
    logout,
    googleOAuth,
} = require("../controllers/signupLoginController");

const { uploadSignup, uploadItemFiles } = require("../services/s3Upload");

const { 
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
} = require('../middleware/validator');


// no auth routes

router.post("/api/signup", uploadSignup.single('profilePic'), signUpValidator, signUp);

router.post("/api/inviteSignup", uploadSignup.single('profilePic'), inviteSignupValidator, inviteSignup)

router.post("/api/verifyOTP", verifyOTPValidator, verifyOTP);

router.post("/api/login", loginValidator, login);

router.post("/api/logout", logout);

router.post("/api/googleOAuth", googleOAuth);

// payment routes

// router.post("/api/create-order", createOrder);

// router.post("/api/verify-payment", verifyPayment);

router.post("/api/create-order", commonAuth, createOrder);

router.post("/api/verify-payment", commonAuth, verifyPayment);

// admin only routes

router.post("/api/project", adminAuth, createProjectValidator, createProject);

router.post("/api/sprint", adminAuth, createSprintValidator, createSprint);

router.post("/api/addMembers", adminAuth, addMembersValidator, addMembers);

router.post("/api/startSprint", adminAuth, startSprintValidator, startSprint);

// common routes

router.post("/api/item", commonAuth, uploadItemFiles.array('attachments', 5), createItemValidator, createItem);

router.put("/api/item/:id", commonAuth, updateItem);

router.delete("/api/item/:id", commonAuth, deleteItemValidator, deleteItem);

router.post("/api/comment", commonAuth, addCommentValidator, addComment)

router.get("/api/project", commonAuth, getProjects);

router.get("/api/items", commonAuth, getItem);

router.get("/api/sprints", commonAuth, getSprints);

router.post("/api/moveItem", commonAuth, moveItemValidator, moveItem);

router.get("/api/getMembers", commonAuth, getMembers);

router.post("/api/changeItemStatus", commonAuth, changeItemStatusValidator, changeItemStatus);

module.exports = router;