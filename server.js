const express = require('express');
const app = express();

app.use(express.json());

// Importar rutas
const usuariosRoutes = require('./routes/usuarios.routes');
const productosRoutes = require('./routes/productos.routes');

// Ruta raíz
app.get('/', (req, res) => {
  res.json({ mensaje: "Bienvenido a mi API 🚀. Probá /usuarios o /productos" });
});

// Usar rutas
app.use('/usuarios', usuariosRoutes);
app.use('/productos', productosRoutes);

// Servidor
app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
