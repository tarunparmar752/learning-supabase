const mongoose = require('mongoose');

mongoose.connect('mongodb://localhost:27017/paytm');

const userSchema = new mongoose.Schema({
    firstName: String,
    lastName: String,
    username: String,
    password: String,
});

export const User = mongoose.model('User', userSchema);