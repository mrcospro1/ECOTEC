require('dotenv').config();
const express = require("express");
const cors = require("cors");
const app = express();
app.use(express.json());

app.use(cors({
  origin: process.env.CORS_ORIGIN,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));
// Ruta raíz
app.get("/", (req, res) => {
  res.json({ mensaje: "Servidor funcionando" });
});
// Importar rutas
const usuariosRoutes = require("./routes/usuarios.routes");
app.use("/usuarios", usuariosRoutes);
const consultaRoutes= require("./routes/consulta.routes");
app.use("/consulta", consultaRoutes);
const presupuestoTermotanquesRoutes=("./routes/presupuesto-termotanques.routes");
app.use("presupuesto-termotanques", presupuestoTermotanquesRoutes);


// Levantar servidor
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}.`);
});
