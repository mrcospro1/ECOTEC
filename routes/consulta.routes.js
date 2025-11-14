const prisma = require('../prismaModulo');
const express = require('express');
const router = express.Router();
const cors = require('cors');
const fetch = require('node-fetch').default; // Asegúrate de tener 'node-fetch' instalado

// 🔑 CLAVES SECRETAS DE EMAILJS (¡Obtenidas de tu panel!)
// NOTA: Estas son claves privadas, ¡NUNCA las expongas en el frontend!
const EMAILJS_SERVICE_ID = 'service_rcforg8'; // Tu Service ID
const EMAILJS_TEMPLATE_ID = 'template_d1enr3h'; // Tu Template ID
const EMAILJS_PRIVATE_KEY = process.env.EMAILJS_PRIVATE_KEY; // ¡Debes definir esta variable en tu .env!
console.log(process.env.EMAILJS_PRIVATE_KEY)
router.use(cors({
    origin: process.env.CORS_ORIGIN
}));

router.post("/registro", async (req, res) => {
    // 1. Recibimos solo los datos del formulario (sin el token de reCAPTCHA)
    const { nombre, apellido, asunto, mail } = req.body;

    // 2. Validación de campos
    if (!nombre || !apellido || !asunto || !mail) {
        // Mensaje de error ajustado.
        return res.status(400).json({ error: "Faltan datos obligatorios." });
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(mail)) {
        return res.status(400).json({ error: "Email inválido" });
    }

    // ... (Validación de campos y email se mantiene) ...

    try {
        // 1. Guardar la consulta en la base de datos (Prisma/Supabase)
        const nuevaConsulta = await prisma.consulta.create({
            data: { nombre, apellido, asunto, mail },
        });

        // 2. Respuesta de éxito. ¡Devolvemos todos los datos, incluyendo ID y fecha!
        res.status(201).json({
            mensaje: "Registro guardado con éxito.",
            consulta: nuevaConsulta, // Esto contiene: id, fecha, nombre, apellido, mail, asunto
        });

    } catch (error) {
        console.error("Error en el proceso de guardado:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
});


module.exports = router;