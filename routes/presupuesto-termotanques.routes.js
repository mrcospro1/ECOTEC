const prisma = require('../prismaModulo.js');
const express = require('express');
const router = express.Router();
const cors = require('cors');

router.use(cors({
  origin: [process.env.CORS_ORIGIN, "http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));


function seleccionarModelo(personas, agua) {
  // Tanque y Red => mismos modelos atmosféricos
  if (agua === "red" || agua === "tanque") {
    if (personas <= 2) return { modelo: "ATMS 100 RI", precio: 696900 };
    if (personas <= 3) return { modelo: "ATMS 150 RI", precio: 830500 };
    if (personas <= 4) return { modelo: "ATMS 200 RI", precio: 939280 };
    if (personas <= 6) return { modelo: "ATMS 300 RI", precio: 1313400 };
    return { modelo: "ATMS 400 RI", precio: 1521025 };
  }

  // Bomba presurizadora
  if (agua === "bomba") {
    return { modelo: "PRE-200 RI", precio: 1373765 };
  }

  throw new Error("Tipo de agua inválido");
}

function calcularAccesorios({ automatizado, altura, agua }) { // Se incluye 'agua' para la lógica
  let accesorios = [];
  let precioAccesorios = 0;

  if (automatizado) {
    accesorios.push({ nombre: "Control TK-8", precio: 115270 });
    precioAccesorios += 115270;
  }

  // Solo aplicar la lógica de altura si el tipo de agua es 'tanque'.
  // La red de agua ('red') no requiere el tanque de prellenado, aunque la altura sea 0.
  if (agua === "tanque" && altura >= 1.5) {
    accesorios.push({ nombre: "Tanque de prellenado", precio: 114148 });
    precioAccesorios += 114148;
  }

  return { accesorios, precioAccesorios };
}

router.post("/calculo", async (req, res) => {
  try {
    let { personas, agua, automatizado, altura } = req.body;

    personas = parseInt(personas);
    altura = parseFloat(altura);
    // Aseguramos que 'automatizado' es booleano para el cálculo y guardado
    automatizado = automatizado === true || automatizado === "true"; 

    const modelo = seleccionarModelo(personas, agua);

    const { accesorios, precioAccesorios } = calcularAccesorios({
      automatizado,
      altura,
      agua, // Se pasa 'agua' a la función de accesorios
    });

    const precioFinal = modelo.precio + precioAccesorios;

    // Se asume que 'prisma.presupuestoTermotanques' existe y es correcto
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
    res.status(500).json({ error: "Error en el servidor", detalle: error.message });
  }
});


module.exports = router;