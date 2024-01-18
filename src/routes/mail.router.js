const express = require('express');
const router = express.Router();
const { findAll, filterMessages, createMessage, deleteMessage, upload } = require('../controller/mail.controller');


router.get('/folders', findAll);


router.get('/messages', filterMessages);


router.post('/messages/:folder', upload.single('file') ,  createMessage);


router.delete('/messages/important/:id', deleteMessage);


module.exports = router;
