const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

// Importar rutas
const usuariosRoutes = require("./routes/usuarios.routes");
app.use("/usuarios", usuariosRoutes);
<<<<<<< HEAD
const consultaRoutes=require("./routes/consulta.routes")
app.use("/consulta", consultaRoutes);

=======
const consultaRoutes= require("./routes/consulta.routes");
app.use("/consulta", consultaRoutes);
>>>>>>> feature/importar-exce
// Ruta raíz
app.get("/", (req, res) => {
  res.json({ mensaje: "Servidor funcionando" });
});
// Levantar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
