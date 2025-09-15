const express = require("express");
const cors = require("cors");
const XLSX = require("xlsx");

const app = express();
app.use(cors());
app.use(express.json());

// Importar rutas
const usuariosRoutes = require("./routes/usuarios.routes");
app.use("/usuarios", usuariosRoutes);

// Ruta raíz
app.get("/", (req, res) => {
  res.json({ mensaje: "Servidor funcionando" });
});

// Levantar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
