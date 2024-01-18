const express = require('express');
const bodyParser = require('body-parser');
const mailRoutes = require('./src/routes/mail.router');

const app = express();
const PORT = 3000;  

app.use(bodyParser.json());

app.use('/:user/api', mailRoutes); 

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
