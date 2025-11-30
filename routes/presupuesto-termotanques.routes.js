const prisma = require('../prismaModulo.js');
const express = require('express');
const router = express.Router();
const cors = require('cors');

// Importar la base de datos de precios desde el archivo JSON
const dataBase = require('../precios.js'); 

// Configuración de CORS

router.use(cors({
  origin: [process.env.CORS_ORIGIN, "http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ======================================
// Lógica de Modelo (Consulta prices.json)
// ======================================
function seleccionarModelo(personas, agua) {
    let modelos = dataBase.modelos_termotanques;
    let modeloSeleccionado = null;

    if (agua === "bomba") {
        // Para Bomba presurizadora, solo hay un modelo (PRE-200 RI en tu lista anterior)
        // Buscamos un modelo que esté etiquetado como "presurizado" o que coincida con la capacidad.
        // Simplificaremos asumiendo que el "PRE-200" es la única opción si es presurizado:
        modeloSeleccionado = modelos.find(m => m.modelo.includes("PRE-200"));
        
        if (!modeloSeleccionado) {
            return { modelo: "PRE-200 RI", precio: 1373765 }; // Fallback si no lo encuentra en JSON
        }
        
    } else if (agua === "red" || agua === "tanque") {
        // Tanque y Red => modelos atmosféricos (ATMS)
        modeloSeleccionado = modelos.find(m => 
            personas >= m.personas_min && personas <= m.personas_max
        );
    }
    
    if (modeloSeleccionado) {
        return { 
            modelo: modeloSeleccionado.modelo, 
            precio: modeloSeleccionado.precio_base 
        };
    }

    // Modelo por defecto o error si no se encuentra
    throw new Error(`No se encontró un modelo para ${personas} personas con alimentación ${agua}.`);
}

// ======================================
// Lógica de Accesorios (Consulta prices.json)
// ======================================
function calcularAccesorios({ automatizado, altura, agua }) { 
    let accesorios = [];
    let precioAccesorios = 0;
    const preciosAdicionales = dataBase.precios_adicionales;
    const accDataBase = dataBase.accesorios;

    // 1. Controlador Automático (TK-8)
    if (automatizado) {
        const tk8 = accDataBase.tk8_automatizacion;
        precioAccesorios += tk8.precio;
        accesorios.push({ nombre: tk8.nombre, precio: tk8.precio });
    }

    // 2. Tanque de Prellenado/Kit de Altura (Solo si es Tanque de Agua)
    if (agua === "tanque" && altura > 0) {
        const kitBasePrecio = preciosAdicionales.kit_altura_atmosferico || 0;
        const precioMetroAdicional = preciosAdicionales.precio_metro_adicional_altura || 0;

        let costoTotalAltura = kitBasePrecio; // Costo base del kit (cubre hasta 1m)
        
        // Calcular metros adicionales por encima de 1 metro 
        // Nota: Si usas la lógica de tu `wizard.js` original (altura >= 1.5), puedes cambiar esto.
        // Aquí usamos la lógica del backend anterior (cubriendo los metros adicionales)
        const metrosAdicionales = Math.max(0, altura - 1); 
        const costoAdicional = metrosAdicionales * precioMetroAdicional;
        
        costoTotalAltura += costoAdicional;
        precioAccesorios += costoTotalAltura;

        accesorios.push({
            nombre: `Kit de Presión p/ Altura (Cubriendo ${altura.toFixed(1)}m)`,
            precio: costoTotalAltura
        });
    }

    // Si estás usando la lógica anterior donde solo se agrega el Tanque si altura >= 1.5:
    if (agua === "tanque" && altura >= 1.5) {
        // En este caso, asumimos que el precio de 'kit_altura_atmosferico' es el precio del Tanque de prellenado
        const precioTanque = preciosAdicionales.kit_altura_atmosferico;
        accesorios.push({ nombre: "Tanque de prellenado", precio: precioTanque });
        precioAccesorios += precioTanque;
    }

    return { accesorios, precioAccesorios };
}

// ======================================
// Ruta POST de Cálculo
// ======================================
router.post("/calculo", async (req, res) => {
  try {
    let { personas, agua, automatizado, altura } = req.body;

    personas = parseInt(personas);
    altura = parseFloat(altura);
    
    // Aseguramos que 'automatizado' es booleano
    automatizado = automatizado === true || automatizado === "true"; 

    // 1. Validaciones básicas
    if (!['red', 'tanque', 'bomba'].includes(agua) || isNaN(personas) || personas < 1) {
         return res.status(400).json({ error: "Datos de entrada inválidos." });
    }

    const modelo = seleccionarModelo(personas, agua);

    const { accesorios, precioAccesorios } = calcularAccesorios({
      automatizado,
      altura,
      agua,
    });

    const precioFinal = modelo.precio + precioAccesorios;

    // 2. Guardar en la BD (prisma)
    const nuevo = await prisma.presupuestoTermotanques.create({
      data: { 
        personas, 
        agua, 
        automatizado, 
        altura,
        modeloElegido: modelo.modelo,
        precioBase: modelo.precio,
        precioAccesorios: precioAccesorios,
        precioFinal: precioFinal
      },
    });

    // 3. Devolver el resultado al cliente
    return res.json({
      modelo: modelo.modelo,
      precioBase: modelo.precio,
      accesorios,
      precioAccesorios,
      precioFinal,
      datosGuardados: nuevo, // Incluye la respuesta completa de Prisma
    });

  } catch (error) {
    console.error("Error al procesar el cálculo:", error);
    res.status(500).json({ error: "Error en el servidor al calcular el presupuesto.", detalle: error.message });
  }
});


module.exports = router;