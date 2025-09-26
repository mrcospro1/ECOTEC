const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const express = require('express');
const router = express.Router();
const cors = require('cors');
const nodemailer = require("nodemailer");

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
      data: { nombre, apellido, asunto, mail },
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
      subject: `📩 Nueva consulta`,
      text: `Consulta #${nuevaConsulta.id} de ${nuevaConsulta.nombre} ${nuevaConsulta.apellido} - Email: ${nuevaConsulta.mail} - Asunto: ${nuevaConsulta.asunto} - Fecha: ${nuevaConsulta.createdAt}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <div style="background-color: #0952eeff; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Nueva Consulta Recibida</h1>
          </div>
          <div style="padding: 20px; color: #333;">
            <p><strong>Cliente N°:</strong> ${nuevaConsulta.id}.</p>
            <p><strong>Fecha:</strong> ${new Date(nuevaConsulta.fecha).toLocaleString()}.</p>
            <p><strong>Nombre:</strong> ${nuevaConsulta.nombre} ${nuevaConsulta.apellido}.</p>
            <p><strong>Email:</strong> ${nuevaConsulta.mail}</p>
            <p><strong>Asunto:</strong></p>
            <div style="background-color: #f7f7f7; padding: 10px; border-radius: 5px; border: 1px solid #eee;">
              ${nuevaConsulta.asunto}
            </div>
          </div>
          <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #555;">
            Este correo se envió automáticamente desde el formulario de la web.
          </div>
        </div>
      `,
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
