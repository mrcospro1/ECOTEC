const prisma = require('../prismaModulo');
const express = require('express');
const router = express.Router();
const cors = require('cors');
// 🚨 CORRECCIÓN CLAVE: Usar .default al importar node-fetch en CommonJS
const fetch = require('node-fetch').default; 
const { Resend } = require('resend');

// 💡 Variables de entorno
const EMAIL_EMPRESA = 'marcosbenitez1237@gmail.com'; 
// 🔑 Remitente de Resend para desarrollo (no requiere dominio verificado)
const EMAIL_REMITENTE_RESEND = 'onboarding@resend.dev'; 

const resend = new Resend(process.env.RESEND_KEY_API);

router.use(cors({
    origin: process.env.CORS_ORIGIN
}));

router.post("/registro", async (req, res) => {
    // Renombramos el token para mayor claridad
    const { nombre, apellido, asunto, mail, "g-recaptcha-response": recaptchaToken } = req.body;

    // 1. Validación de campos 
    if (!nombre || !apellido || !asunto || !mail || !recaptchaToken) {
        return res.status(400).json({ error: "Faltan datos obligatorios o token del captcha" });
    }

    // 2. Validación de formato de email
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mail)) {
        return res.status(400).json({ error: "Email inválido" });
    }

    try {
        // --- Bloque de Verificación reCAPTCHA ---
        const secretKey = process.env.RECAPTCHA_SECRET_KEY;
        const expectedAction = 'submit'; 

        const params = new URLSearchParams();
        params.append('secret', secretKey);
        params.append('response', recaptchaToken);
        
        const respuesta = await fetch("https://www.google.com/recaptcha/api/siteverify", {
            method: "POST",
            body: params,
        });

        const data = await respuesta.json();

        // 4. Verificación del reCAPTCHA
        if (!data.success || data.score < 0.5 || data.action !== expectedAction) {
            console.warn(`reCAPTCHA falló: success=${data.success}, score=${data.score}, action=${data.action}`);
            return res.status(400).json({ error: "Fallo la verificación del reCAPTCHA" });
        }
        // --- Fin Bloque reCAPTCHA ---

        // 5. Guardar la consulta en la base de datos (Prisma)
        const nuevaConsulta = await prisma.consulta.create({
            data: { nombre, apellido, asunto, mail },
        });

        // 6. Enviar el correo electrónico a la EMPRESA (Notificación)
        const emailEmpresa = resend.emails.send({
            // 🔑 USANDO REMITENTE DE DESARROLLO DE RESEND
            from: `Formulario Web <${EMAIL_REMITENTE_RESEND}>`, 
            to: EMAIL_EMPRESA, // 👈 Correo de tu empresa
            reply_to: mail, // 👈 Importante para responderle al usuario fácilmente
            subject: `📩 Nueva consulta de ${nombre} ${apellido}`,
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
                           style="background-color: #007bff; color: white; padding: 12px 25px; border-radius: 6px; text-decoration: none; font-weight: bold; display: inline-block;">
                            Responder
                        </a>
                    </div>
                    <div style="background-color: #f1f1f1; padding: 10px; text-align: center; font-size: 12px; color: #555;">
                        Este correo se envió automáticamente desde el formulario de la web.
                    </div>
                </div>
            `,
        });

        // 7. Enviar el correo electrónico al USUARIO (Confirmación)
        const emailUsuario = resend.emails.send({
            // 🔑 USANDO REMITENTE DE DESARROLLO DE RESEND
            from: `Tu Empresa <${EMAIL_REMITENTE_RESEND}>`,
            to: mail, // 👈 Correo proporcionado por el usuario
            subject: '✅ ¡Tu mensaje ha sido recibido con éxito!',
            html: `
                <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; text-align: center; border: 1px solid #ccc; border-radius: 10px;">
                    <h1 style="color: #4CAF50;">¡Gracias por contactarnos, ${nombre}!</h1>
                    <p style="font-size: 16px; color: #555;">Hemos recibido tu consulta y un miembro de nuestro equipo te responderá a la brevedad.</p>
                    <hr style="border: 0; border-top: 1px solid #eee; margin: 20px 0;">
                    <p style="font-weight: bold;">Copia de tu mensaje:</p>
                    <div style="background-color: #f9f9f9; padding: 15px; border-radius: 5px; text-align: left;">
                        <p><strong>Asunto:</strong> ${asunto}</p>
                        <p><strong>Contenido:</strong> ${asunto}</p>
                    </div>
                </div>
            `
        });
        
        // Esperamos a que ambos correos se envíen
        await Promise.allSettled([emailEmpresa, emailUsuario]);

        // 8. Respuesta de éxito
        res.status(201).json({
            mensaje: "Registro y correos enviados con éxito",
            consulta: nuevaConsulta,
        });

    } catch (error) {
        console.error("Error en el proceso:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});

module.exports = router;
