const socketIo = require('socket.io');
const cookie = require('cookie');
const jwt = require("jsonwebtoken");
const User = require("./models/userModel");
const Project = require("./models/projectModel")
const Message = require("./models/messageModel");

const initSocket = (server) => {
    const io = socketIo(server, {
        cors: {
            origin: 'http://localhost:3000',
            credentials: true,
        }
    });

    io.use(async(socket, next) => {
        try {
            const cookies = socket.handshake.headers.cookie;
            if(!cookies) {
                return next(new Error("Unauthorized: No cookies"));
            }

            const { tokenn } = cookie.parse(cookies);

            if (!tokenn) {
                return next(new Error("Unauthorized: No token"));
            }

            const decoded = jwt.verify(tokenn, process.env.JWT_SECRET);
            const user = await User.findById(decoded._id);
            if (user && (user.role === 'admin' || user.role === 'normalUser')) {
                socket.user = user;
                next();
            } else {
                return next(new Error("Unauthorized: Invalid role"));
            }
        } catch (error) {
            console.log("Auth error with SOCKET...............", error);
            return next(new Error("Unauthorized: Invalid token", error));
        }
    })

    const connectedUsers = {};

    io.on('connection', (socket) => {
        console.log("New client SocketId.......", socket.id, socket.user._id, socket.user.firstName);
        connectedUsers[socket.user._id] = socket.id;
        console.log("connectedUsers.........", connectedUsers);

        socket.on('chatMessage', async(message) => {
            console.log("message.......", message);

            const newMessage = new Message({
                messageContent: message.content,
                senderId: socket.user._id,
                receiverId: message.messageTo,
                projectId: message.projectId,
            });
        
            await newMessage.save();

            const recieverSocketId = connectedUsers[message.messageTo];
            if(message.messageTo) {                
                console.log("PRIVATE MESSAGE....", message.messageTo, recieverSocketId);
                if(recieverSocketId) {
                    console.log("RECIEVER FOUND....");
                    io.to(recieverSocketId).emit('private_message', {
                        messageContent: message.content,
                        senderId: socket.user._id,
                        sentAt: new Date(),
                    });
                }
            }
        });

        socket.on('joinProject', async({projectId}) => {
            try {
                const project = await Project.findById(projectId).populate('members');
                console.log("PROJECT found.........", project);
                const isMember = socket.user.projects.some(project => project.toString() === projectId);
                const isCreator = socket.user._id.equals(project.createdBy);
                console.log("isMember..........", socket.user.projects);
                if(isMember || isCreator) {
                    console.log("Yes YOU are a MEMBER of this project");
                    socket.join(projectId);
                    console.log(`${socket.user.firstName} joined project: ${projectId}`);
                }
            } catch (error) {
                console.log('Error joining project:', error);
                socket.emit('error', { message: 'An error occurred', error });
            }
        });

        socket.on('sentMessageToGroup', async({ projectId, content }) => {
            console.log("GROUP message RECIEVED...............",content);

            const groupMessage = new Message({
                messageContent: content,
                senderId: socket.user._id,
                projectGroupId: projectId,
            });
        
            await groupMessage.save();

            socket.to(projectId).emit('receiveMessageFromGroup', {
                messageContent: content,
                senderId: socket.user._id,
                projectGroupId: projectId,
                sentAt: new Date(),
            })
        })

        socket.on('disconnect', () => {
            console.log('Client disconnected');
        });
    })
};

module.exports = initSocket;