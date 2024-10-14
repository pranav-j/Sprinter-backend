require("dotenv").config();
require("./config/bdConfig");

const express = require('express');
const cookieParser = require('cookie-parser');
const http = require('http');
const cors = require('cors');
const routes = require("./routes/router");
const initSocket = require('./socket')
// const dotenv = require('dotenv');

// dotenv.config();

const app = express();

const server = http.createServer(app);

app.use(express.json());

app.use(cookieParser());

// app.use(cors({ origin: 'http://localhost:3001', credentials: true }));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use(routes);

initSocket(server);

const PORT = process.env.PORT;

server.listen(PORT, () => {
    console.log("Server running on..............", PORT);
});