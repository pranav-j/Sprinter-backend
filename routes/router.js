const express = require('express');
const router = express.Router();

const { adminAuth, commonAuth } = require("../middleware/auth")

const { 
    signUp, 
    verifyOTP, 
    login, 
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

const { inviteSignup } = require("../controllers/normalUserController");

const { uploadSignup, uploadItemFiles } = require("../services/s3Upload");


// no auth routes

router.post("/api/signup", uploadSignup.single('profilePic'), signUp);

router.post("/api/inviteSignup", uploadSignup.single('profilePic'), inviteSignup)

router.post("/api/verifyOTP", verifyOTP);

router.post("/api/login", login);

// admin only routes

router.post("/api/project", adminAuth, createProject);

router.post("/api/sprint", adminAuth, createSprint);

router.post("/api/addMembers", adminAuth, addMembers);

router.post("/api/startSprint", adminAuth, startSprint);

// common routes

router.post("/api/item", commonAuth, uploadItemFiles.array('attachments', 5), createItem);

router.put("/api/item/:id", commonAuth, updateItem);

router.delete("/api/item/:id", commonAuth, deleteItem);

router.post("/api/comment/:id", commonAuth, addComment)

router.get("/api/project", commonAuth, getProjects);

router.get("/api/items", commonAuth, getItem);

router.get("/api/sprints", commonAuth, getSprints);

router.post("/api/moveItem", commonAuth, moveItem);

router.get("/api/getMembers", commonAuth, getMembers);

router.post("/api/changeItemStatus", commonAuth, changeItemStatus);

module.exports = router;