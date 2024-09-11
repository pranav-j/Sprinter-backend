require("./config/bdConfig");

const express = require('express');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const routes = require("./routes/router");
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(express.json());

app.use(cookieParser());

// app.use(cors({ origin: 'http://localhost:3001', credentials: true }));
app.use(cors({ origin: 'http://localhost:3000', credentials: true }));

app.use(routes);

const PORT = process.env.PORT;

app.listen(PORT, () => {
    console.log("Server running on..............", PORT);
});