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

/**
 * Calcula los accesorios necesarios (Control TK-8 y Tanque de Prellenado).
 * El Tanque de Prellenado solo se añade si es 'tanque' Y la altura es < 1.7m.
 * Para 'red' o 'bomba', la altura no importa para este accesorio.
 */
function calcularAccesorios({ automatizado, altura, agua }) { // Se recibe 'agua'
  let accesorios = [];
  let precioAccesorios = 0;

  if (automatizado) {
    accesorios.push({ nombre: "Control TK-8", precio: 115270 });
    precioAccesorios += 115270;
  }
  
  // 🔑 CORRECCIÓN DE LÓGICA: 
  // El Tanque de prellenado se necesita solo para 'tanque' si la altura es baja.
  // La condición anterior (agua === "red" || agua === "tanque") estaba mal.
  // Queremos: SOLO si es 'tanque' Y altura es menor a 1.7.
  if (agua === "tanque" && altura < 1.7) {
    accesorios.push({ nombre: "Tanque de prellenado", precio: 114148 });
    precioAccesorios += 114148;
  }
  // NOTA: Si la altura de tanque debe ser >= 1.7m, la condición debe ser: altura < 1.7.
  // Usé 1.7m ya que es el estándar común.

  return { accesorios, precioAccesorios };
}

router.post("/calculo", async (req, res) => {
  try {
    let { personas, agua, automatizado, altura } = req.body;

    personas = parseInt(personas);
    altura = parseFloat(altura) || 0; 
    automatizado = automatizado === true || automatizado === "true";

    const modelo = seleccionarModelo(personas, agua);

    const { accesorios, precioAccesorios } = calcularAccesorios({
      automatizado,
      altura,
      agua, // <-- ¡Añadido!
    });

    const precioFinal = modelo.precio + precioAccesorios;

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
