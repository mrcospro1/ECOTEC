const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();

router.post("/registro", async (req, res) => {
  const { nombre, apellido, asunto, mail } = req.body;
  if (!nombre || !apellido || !asunto || !mail) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }
  try {
    const nuevaConsulta = await prisma.consulta.create({
      data: {
        nombre,
        apellido,
        asunto,
        mail,
      },
    });

    res.status(201).json({
      mensaje: "Registro exitoso",
      consulta: nuevaConsulta,
    });
  } catch (error) {
    console.error("Error al crear consulta:", error);
    res.status(500).json({ error: "Error interno del servidor" });
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
