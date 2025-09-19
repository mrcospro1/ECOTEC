const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();

router.post("/registro", async (req,res)=>{
    const {nombre,apellido,asunto, mail}=req.body;
    try{
        const nuevaConsulta= await prisma.Consulta.create({
        data:{
            nombre:nombre,
            apellido:apellido,
            asunto:asunto,
            mail:mail
        }
    })
    res.json({mensaje:` consulta registrada con exito.
        consulta:${asunto}
        mail: ${mail}.`})
    } catch(err) {
        console.log(err);
        res.status(500).json({mensaje:"Error al registrarse."})
    }
});

router.get("/ver", async (req, res) => {
  try {
    const consultas = await prisma.consulta.findMany();
    res.json(consultas);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al obtener consultas" });
  }
});


module.exports = router;