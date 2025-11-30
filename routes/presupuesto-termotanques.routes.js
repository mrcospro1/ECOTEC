// presupuesto-termotanques.routes.js
const prisma = require('../prismaModulo.js');
const express = require('express');
const router = express.Router();
const cors = require('cors');

// Importar la base de datos de precios desde el archivo JSON
// Ajusta la ruta si es necesario (ej: require('./prices.json') si está en la misma carpeta)
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
// Lógica de Modelo (Consulta prices.json)
// ======================================
function seleccionarModelo(personas, agua) {
    let modelos = dataBase.modelos_termotanques;
    let modeloSeleccionado = null;

    if (agua === "bomba") {
        // Asumimos que hay un modelo presurizado específico para 'bomba'
        modeloSeleccionado = modelos.find(m => m.modelo.includes("PRE-200"));
        
        if (!modeloSeleccionado) {
            // Fallback para el modelo presurizado si no está en la lista JSON
            return { modelo: "PRE-200 RI", precio_base: 1373765 }; 
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
            precio: modeloSeleccionado.precio_base // Usamos 'precio' como clave de retorno
        };
    }

    // Caso de capacidad no encontrada
    return { modelo: "Capacidad no estándar", precio: 0 };
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

    // 2. Kit/Tanque de Altura (Solo si es Tanque de Agua)
    if (agua === "tanque" && altura > 0.5) {
        const kitBasePrecio = preciosAdicionales.kit_altura_atmosferico || 0;
        const precioMetroAdicional = preciosAdicionales.precio_metro_adicional_altura || 0;

        let costoTotalAltura = 0;
        
        // Asumimos que el kit base (kit_altura_atmosferico) cubre el primer metro (o es el tanque de prellenado)
        costoTotalAltura += kitBasePrecio;
        
        // Calcular metros adicionales por encima de 1 metro
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

    // Asegurar tipos de datos correctos para el cálculo y Prisma
    personas = parseInt(personas) || 1;
    altura = parseFloat(altura) || 0.0;
    automatizado = automatizado === true || automatizado === "true"; // Asegura booleano

    // 1. Validaciones básicas
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

    const precioFinal = modelo.precio + precioAccesorios;

    // 3. Preparar el objeto para Prisma (Debe COINCIDIR con el schema)
    const prismaData = {
        personas, 
        agua, 
        automatizado, 
        altura,
        modeloElegido: modelo.modelo, // <--- CAMPO NUEVO
        precioBase: modelo.precio,   // <--- CAMPO NUEVO
        precioAccesorios: precioAccesorios, // <--- CAMPO NUEVO
        precioFinal: precioFinal        // <--- CAMPO NUEVO
    };
    
    // 4. Guardar en la BD
    const nuevo = await prisma.presupuestoTermotanques.create({
      data: prismaData,
    });

    // 5. Devolver el resultado al cliente
    return res.json({
      modelo: modelo.modelo,
      precioBase: modelo.precio,
      accesorios,
      precioAccesorios,
      precioFinal,
      datosGuardados: nuevo, 
    });

  } catch (error) {
    console.error("Error al procesar el cálculo:", error);
    // En caso de un error de lógica de modelo, devolvemos 404/400
    if (error.message.includes('No se encontró un modelo')) {
         return res.status(404).json({ error: error.message });
    }
    // Para otros errores (conexión DB, etc.)
    res.status(500).json({ error: "Error interno del servidor.", detalle: error.message });
  }
});


module.exports = router;