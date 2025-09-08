const express = require('express');
const app = express();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

app.use(express.json());
const usuariosRoutes = require('./routes/usuarios.routes')(prisma);
const productosRoutes = require('./routes/productos.routes')(prisma);
app.get('/', (req, res) => {
  res.json({ mensaje: "Bienvenido a mi API 🚀. Probá /usuarios o /productos" });
});
app.use('/usuarios', usuariosRoutes);
app.use('/productos', productosRoutes);

app.listen(3000, () => {
  console.log("Servidor corriendo en http://localhost:3000");
});
