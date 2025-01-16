const express = require('express');
const Router = express.Router();

Router.get('/', (req, res) => {
    res.json({ message: 'CORS is working!' });
});

module.exports = Router;