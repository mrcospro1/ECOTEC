const prisma = require('../prismaModulo');
const express = require('express');
const router = express.Router();
const cors = require('cors');

router.use(cors({
    origin: process.env.CORS_ORIGIN
}));

router.post("/calculo", async (req, res) =>{

 const { personas, agua, automatizado, altura } = req.body;

if(!personas || !agua || !automatizado || !altura){
    return res.status(400).json({ error: "Faltan datos obligatorios para el calculo" });
}
const nuevaConsulta = await prisma.Presupuesto-termotanques.create({
    data: { personas, agua, automatizado, altura },
});
 console.log(personas,agua,automatizado, altura);
}
);
  
    

