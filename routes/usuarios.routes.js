const express = require('express');
const router = express.Router();

// GET /usuarios
router.get('/', (req, res) => {
  res.json({ mensaje: "Esta es la ruta GET de mi entidad usuarios, muestra todos los elementos" });
});

// GET /usuarios/:id
router.get('/:id', (req, res) => {
  res.json({ mensaje: `Esta es la ruta GET de mi entidad usuarios con el ID ${req.params.id}` });
});

// POST /usuarios
router.post('/', (req, res) => {
  res.json({ mensaje: "Esta es la ruta POST de mi entidad usuarios" });
});

// PUT /usuarios/:id
router.put('/:id', (req, res) => {
  res.json({ mensaje: `Esta es la ruta PUT de mi entidad usuarios con el ID ${req.params.id}` });
});

// DELETE /usuarios/:id
router.delete('/:id', (req, res) => {
  res.json({ mensaje: `Esta es la ruta DELETE de mi entidad usuarios con el ID ${req.params.id}` });
});

module.exports = router;
