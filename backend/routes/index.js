const express = require('express');
const Router = express.Router();

Router.use('/users', require('./users'));
Router.use('/bulk-users', require('./bulk-users'));

module.exports = Router;