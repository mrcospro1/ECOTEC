const prisma = require('../prismaModulo');
const express = require('express');
const router = express.Router();
const cors = require('cors');

router.use(cors({
  origin: [process.env.CORS_ORIGIN, "http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


function seleccionarModelo(personas, agua) {
  if (agua === "red") {
    if (personas <= 2) return { modelo: "ATMS 100 RI", precio: 696900 };
    if (personas <= 3) return { modelo: "ATMS 150 RI", precio: 830500 };
    if (personas <= 4) return { modelo: "ATMS 200 RI", precio: 939280 };
    if (personas <= 6) return { modelo: "ATMS 300 RI", precio: 1313400 };
    return { modelo: "ATMS 400 RI", precio: 1521025 };
  }

  if (agua === "bombeado") {
    return { modelo: "PRE-200 RI", precio: 1373765 };
  }

  throw new Error("Tipo de agua inválido");
}

function calcularAccesorios({ automatizado, altura }) {
  let accesorios = [];
  let precioAccesorios = 0;

  // Automatización = TK-8
  if (automatizado) {
    accesorios.push({ nombre: "Control TK-8", precio: 115270 });
    precioAccesorios += 115270;
  }

  // Tanque de prellenado si altura < 1.7m
  if (altura < 1.7) {
    accesorios.push({ nombre: "Tanque de prellenado", precio: 114148 });
    precioAccesorios += 114148;
  }

  return { accesorios, precioAccesorios };
}
router.get("/", (req, res) => {
  res.send("OK");
});

router.post("/calculo", async (req, res) => {
  try {
    let { personas, agua, automatizado, altura } = req.body;

    personas = parseInt(personas);
    altura = parseFloat(altura);
    automatizado = automatizado === true || automatizado === "true";

    // 1. Modelo y precio base
    const modelo = seleccionarModelo(personas, agua);

    // 2. Accesorios según reglas
    const { accesorios, precioAccesorios } = calcularAccesorios({
      automatizado,
      altura
    });

    // 3. Precio final
    const precioFinal = modelo.precio + precioAccesorios;

    // 4. Guardar en DB
    const nuevo = await prisma.presupuestoTermotanques.create({
      data: { personas, agua, automatizado, altura },
    });

    return res.json({
      modelo: modelo.modelo,
      precioBase: modelo.precio,
      accesorios,
      precioAccesorios,
      precioFinal,
      datosGuardados: nuevo,
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Error en el servidor" });
  }
});




module.exports = router;
