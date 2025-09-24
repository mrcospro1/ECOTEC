const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();
const cors = require('cors');
const nodemailer=require("nodemailer");

router.use(cors({
  origin: process.env.CORS_ORIGIN
}));

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
  const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS, 
  },
  });
  await transporter.sendMail({
      from: process.env.EMAIL_USER,
      to: "marcosbenitez1237@gmail.com",
      subject: "Nueva consulta",
      text: `Nombre: ${nombre} ${apellido} - Email: ${mail} - Asunto: ${asunto}`,
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
