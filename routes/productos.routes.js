const express = require('express');
const router = express.Router();

// GET /productos
router.get('/', (req, res) => {
  res.json({ mensaje: "Esta es la ruta GET de mi entidad productos, muestra todos los elementos" });
});

// GET /productos/:id
router.get('/:id', (req, res) => {
  res.json({ mensaje: `Esta es la ruta GET de mi entidad productos con el ID ${req.params.id}` });
});

// POST /productos
router.post('/', (req, res) => {
  res.json({ mensaje: "Esta es la ruta POST de mi entidad productos" });
});

// PUT /productos/:id
router.put('/:id', (req, res) => {
  res.json({ mensaje: `Esta es la ruta PUT de mi entidad productos con el ID ${req.params.id}` });
});

// DELETE /productos/:id
router.delete('/:id', (req, res) => {
  res.json({ mensaje: `Esta es la ruta DELETE de mi entidad productos con el ID ${req.params.id}` });
});

module.exports = router;
