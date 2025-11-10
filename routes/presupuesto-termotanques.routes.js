const prisma = require('../prismaModulo');
const express = require('express');
const router = express.Router();
const cors = require('cors');

router.use(cors({
    origin: process.env.CORS_ORIGIN
}));

router.post("/calculo", async (req, res) =>{

 const { personas, agua, automatizado, altura } = req.body;
 console.log(personas,agua,automatizado, altura);
}
);
  
    

