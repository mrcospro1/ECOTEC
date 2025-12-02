// presupuesto-termotanques.routes.js
const prisma = require('../prismaModulo.js');
const express = require('express');
const router = express.Router();
const cors = require('cors');

// Importar la base de datos de precios desde el archivo JSON
// ¡Asegúrate de que la ruta sea correcta!
const dataBase = require('./prices.json'); 

// ======================================
// Configuración de CORS
// ======================================
router.use(cors({
  origin: [process.env.CORS_ORIGIN, "http://127.0.0.1:5500", "http://localhost:5500"],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

// ======================================
// Lógica de Modelo (Fortalecida contra errores de precio)
// ======================================
function seleccionarModelo(personas, agua) {
    let modelos = dataBase.modelos_termotanques;
    let modeloSeleccionado = null;

    if (agua === "bomba") {
        // Buscar el modelo presurizado por nombre (PRE-200) o tipo
        modeloSeleccionado = modelos.find(m => m.modelo.includes("PRE-200"));
        
        // --- SOLUCIÓN CLAVE PARA EL ERROR NaN ---
        // Si no se encuentra en el JSON, devolvemos un valor conocido (fallback)
        if (!modeloSeleccionado) {
            // Precio conocido del modelo presurizado si no está en el JSON
            return { modelo: "PRE-200 RI", precio: 1373765.00 }; 
        }
        
    } else if (agua === "red" || agua === "tanque") {
        // Modelos atmosféricos (ATMS o TS)
        modeloSeleccionado = modelos.find(m => 
            personas >= m.personas_min && personas <= m.personas_max
        );
    }
    
    // Si se encontró el modelo o se usó el fallback, devolvemos el objeto
    if (modeloSeleccionado) {
        // Aseguramos que el precio base sea un número antes de devolverlo
        const precioBase = parseFloat(modeloSeleccionado.precio_base) || 0;
        return { 
            modelo: modeloSeleccionado.modelo, 
            precio: precioBase 
        };
    }

    // Si no se encuentra NINGÚN modelo (capacidad > 9 personas)
    return { modelo: "Capacidad no estándar", precio: 0.00 };
}

// ======================================
// Lógica de Accesorios
// ======================================
function calcularAccesorios({ automatizado, altura, agua }) { 
    let accesorios = [];
    let precioAccesorios = 0.00;
    const preciosAdicionales = dataBase.precios_adicionales;
    const accDataBase = dataBase.accesorios;

    // 1. Controlador Automático (TK-8)
    if (automatizado) {
        const tk8 = accDataBase.tk8_automatizacion;
        precioAccesorios += parseFloat(tk8.precio) || 0;
        accesorios.push({ nombre: tk8.nombre, precio: tk8.precio });
    }

    // 2. Kit/Tanque de Altura (Solo si es Tanque de Agua)
    if (agua === "tanque" && altura > 0) {
        const kitBasePrecio = parseFloat(preciosAdicionales.kit_altura_atmosferico) || 0;
        const precioMetroAdicional = parseFloat(preciosAdicionales.precio_metro_adicional_altura) || 0;

        let costoTotalAltura = kitBasePrecio; 
        
        const metrosAdicionales = Math.max(0, altura - 1); 
        const costoAdicional = metrosAdicionales * precioMetroAdicional;
        
        costoTotalAltura += costoAdicional;
        precioAccesorios += costoTotalAltura;

        accesorios.push({
            nombre: `Kit Presión p/ Altura (Cubriendo ${altura.toFixed(1)}m)`,
            precio: costoTotalAltura
        });
    }

    return { accesorios, precioAccesorios };
}

// ======================================
// Ruta POST de Cálculo
// ======================================
router.post("/calculo", async (req, res) => {
  try {
    let { personas, agua, automatizado, altura } = req.body;

    // 1. Asegurar tipos de datos correctos
    personas = parseInt(personas) || 1;
    altura = parseFloat(altura) || 0.0;
    automatizado = automatizado === true || automatizado === "true"; 

    if (!['red', 'tanque', 'bomba'].includes(agua)) {
         return res.status(400).json({ error: "Tipo de agua inválido." });
    }

    // 2. Ejecutar Lógica de Cálculo
    const modelo = seleccionarModelo(personas, agua);
    const { accesorios, precioAccesorios } = calcularAccesorios({
      automatizado,
      altura,
      agua,
    });

    // --- PUNTO DE CONTROL DE NaN (Solución Adicional) ---
    // Aunque la función seleccionarModelo fue corregida, siempre aseguramos que los precios sean Float válidos
    const precioBase = parseFloat(modelo.precio) || 0.00;
    const precioTotalAccesorios = parseFloat(precioAccesorios) || 0.00;

    const precioFinal = precioBase + precioTotalAccesorios;

    // 3. Preparar el objeto para Prisma (Debe COINCIDIR con tu schema)
    const prismaData = {
        personas, 
        agua, 
        automatizado, 
        altura,
        modeloElegido: modelo.modelo, 
        precioBase: precioBase,   
        precioAccesorios: precioTotalAccesorios, 
        precioFinal: precioFinal        
    };
    
    // 4. Guardar en la BD
    // Esto funcionará ahora que los precios son números válidos (no NaN) y las columnas existen en la BD.
    const nuevo = await prisma.presupuestoTermotanques.create({
      data: prismaData,
    });

    // 5. Devolver el resultado al cliente
    return res.json({
      modelo: modelo.modelo,
      precioBase: precioBase,
      accesorios,
      precioAccesorios: precioTotalAccesorios,
      precioFinal: precioFinal,
      datosGuardados: nuevo, 
    });

  } catch (error) {
    console.error("Error al procesar el cálculo:", error);
    res.status(500).json({ error: "Error interno del servidor al calcular el presupuesto.", detalle: error.message });
  }
});


module.exports = router;
