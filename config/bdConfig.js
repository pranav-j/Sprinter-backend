const mongoose = require('mongoose');
require('dotenv').config();

mongoose.connect(process.env.dbURI)
    .then(() => {
        console.log('MongoDB connected...............');
    })
    .catch(error => console.log("ERROR...............", error));