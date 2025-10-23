const prisma = require('../prismaModulo');
const express = require('express');
const router = express.Router();
const cors = require('cors');
const fetch = require('node-fetch'); // 👈 necesario para validar el captcha
const { Resend } = require('resend');

const resend = new Resend(process.env.RESEND_KEY_API);

router.use(cors({
  origin: process.env.CORS_ORIGIN
}));

router.post("/registro", async (req, res) => {
  const { nombre, apellido, asunto, mail, "g-recaptcha-response": token } = req.body;

  if (!nombre || !apellido || !asunto || !mail || !token) {
    return res.status(400).json({ error: "Faltan datos obligatorios o token del captcha" });
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(mail)) {
    return res.status(400).json({ error: "Email inválido" });
  }

  try {
    const secretKey = process.env.RECAPTCHA_SECRET_KEY; 
    const respuesta = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: `secret=${secretKey}&response=${token}`,
    });

    const data = await respuesta.json();

    if (!data.success || data.score < 0.5) {
      return res.status(400).json({ error: "Fallo la verificación del reCAPTCHA" });
    }

    const nuevaConsulta = await prisma.consulta.create({
      data: { nombre, apellido, asunto, mail },
    });

    const response = await resend.emails.send({
      from: 'Formulario Web <onboarding@resend.dev>',
      to: process.env.EMAIL_USER,
      subject: '📩 Nueva consulta',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; border: 1px solid #ddd; border-radius: 8px; overflow: hidden; box-shadow: 0 0 10px rgba(0,0,0,0.1);">
          <div style="background-color: #0952eeff; color: white; padding: 20px; text-align: center;">
            <h1 style="margin: 0; font-size: 24px;">Nueva Consulta Recibida</h1>
          </div>
          <div style="padding: 20px; color: #333;">
            <p><strong>Cliente N°:</strong> ${nuevaConsulta.id}</p>
            <p><strong>Fecha:</strong> ${new Date(nuevaConsulta.fecha).toLocaleString()}.</p>
            <p><strong>Nombre:</strong> ${nuevaConsulta.nombre} ${nuevaConsulta.apellido}</p>
            <p><strong>Email:</strong> ${nuevaConsulta.mail}</p>
            <p><strong>Asunto:</strong></p>
            <div style="background-color: #f7f7f7; padding: 10px; border-radius: 5px; border: 1px solid #eee;">
              ${nuevaConsulta.asunto}
            </div>
          </div>
          <div style="text-align: center; margin-top: 30px;">
              <a href="mailto:${nuevaConsulta.mail}"
                 style="background-color: #007bff; 
                        color: white; 
                        padding: 12px 25px; 
                        border-radius: 6px; 
                        text-decoration: none; 
                        font-weight: bold;
                        display: inline-block;">
                Responder
              </a>
            </div>
          </div>
          <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #555;">
            Este correo se envió automáticamente desde el formulario de la web.
          </div>
        </div>
      `,
    });

    if (response.error) {
      console.error('Error al enviar el correo:', response.error);
      return res.status(500).json({ error: "Error al enviar el correo" });
    }

    res.status(201).json({
      mensaje: "Registro exitoso",
      consulta: nuevaConsulta,
    });
  } catch (error) {
    console.error("Error en el proceso:", error);
    res.status(500).json({ error: "Error interno del servidor" });
  }
});

module.exports = router;
