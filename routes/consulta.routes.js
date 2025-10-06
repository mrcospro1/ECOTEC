const prisma = require('../prismaModulo');
const express = require('express');
const router = express.Router();
const cors = require('cors');
const nodemailer = require("nodemailer");

router.use(cors({
  origin: process.env.CORS_ORIGIN
}));

import sgMail from "@sendgrid/mail";
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

router.post("/registro", async (req, res) => {
  const { nombre, apellido, asunto, mail } = req.body;

  if (!nombre || !apellido || !asunto || !mail) {
    return res.status(400).json({ error: "Faltan datos obligatorios" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(mail)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  try {
    const nuevaConsulta = await prisma.consulta.create({
      data: { nombre, apellido, asunto, mail },
    });
    await sgMail.send({
      to: "marcosbenitez1237@gmail.com", // tu correo
      from: "tucorreo@tudominio.com", // debe estar verificado en SendGrid
      subject: "📩 Nueva consulta",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <div style="background-color: #0952eeff; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Nueva Consulta Recibida</h1>
          </div>
          <div style="padding: 20px; color: #333;">
            <p><strong>Cliente N°:</strong> ${nuevaConsulta.id}.</p>
            <p><strong>Fecha:</strong> ${new Date().toLocaleString()}.</p>
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
    await sgMail.send({
      to: nuevaConsulta.mail,
      from: "tucorreo@tudominio.com",
      subject: "Gracias por tu consulta – ECOTEC Energías Alternativas",
      html: `
      <div style="font-family: Arial, sans-serif; background-color: #f4f8ff; padding: 30px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 8px; padding: 20px; border: 1px solid #e1e8f5;">
          
          <h2 style="color: #1a73e8; text-align: center; margin-bottom: 10px;">
            ¡Gracias por tu consulta!
          </h2>

          <p style="color: #333; font-size: 15px;">
            Hola ${nuevaConsulta.nombre || ""}, queremos agradecerte por comunicarte con 
            <strong>ECOTEC Energías Alternativas</strong>.
          </p>

          <p style="color: #333; font-size: 15px;">
            Hemos recibido tu mensaje y nuestro equipo lo estará revisando a la brevedad.  
            Muy pronto nos pondremos en contacto para brindarte una respuesta personalizada.
          </p>

          <hr style="border: none; border-top: 1px solid #e1e8f5; margin: 20px 0;">

          <p style="color: #777; font-size: 13px; text-align: center;">
            Saludos cordiales,<br>
            <strong>Equipo ECOTEC Energías Alternativas</strong>
          </p>
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
