const mongoose = require('mongoose');
const dbgr=require('debug')('development:mongoose');
const  config = require('config');

mongoose
.connect(`${config.get('MONGO_URI')}/Irodov`)
.then(function() {
    console.log("Connected to MongoDB successfully");
    dbgr("Connected to MongoDB");
})
.catch(function(err) {
    console.error("Error connecting to MongoDB:", err.message);
    dbgr("Error connecting to MongoDB:", err);
});


module.exports = mongoose.connection; // Export the mongoose connection for use in other files