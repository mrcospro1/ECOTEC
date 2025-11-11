const prisma = require('../prismaModulo');
const express = require('express');
const router = express.Router();
const cors = require('cors');

router.use(cors({
  origin: [process.env.CORS_ORIGIN, "http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

router.get("/", (req, res) => {
  res.send("OK");
});

router.post("/calculo", async (req, res) => {
  try {
    let { personas, agua, automatizado, altura } = req.body;

    // Validar datos básicos
    if (personas == null || agua == null || automatizado == null || altura == null) {
      return res.status(400).json({ error: "Faltan datos obligatorios para el cálculo" });
    }

    // Convertir a tipos correctos (por si vienen como string desde el frontend)
    personas = parseInt(personas);
    altura = parseFloat(altura);
    automatizado = automatizado === true || automatizado === "true"; // convierte "true" o true en booleano real

    // Crear el registro
    const nuevoPresupuesto = await prisma.presupuestoTermotanques.create({
      data: { personas, agua, automatizado, altura },
    });
    
    console.log(nuevoPresupuesto);
    res.json(nuevoPresupuesto);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});


module.exports = router;
