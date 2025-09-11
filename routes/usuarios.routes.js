const express = require('express');
const router = express.Router();


router.post('/registro', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }

  const hash = await bcrypt.hash(password, 10);

  db.run(
    `INSERT INTO usuarios (username, password) VALUES (?, ?)`,
    [username, hash],
    function(err) {
      if (err) return res.status(500).json({ mensaje: 'Usuario ya existe' });
      res.json({ mensaje: 'Usuario registrado', id: this.lastID });
    }
  );
});

router.get('/', (req, res) => {
  res.json({ mensaje: "Esta es la ruta GET de mi entidad usuarios, muestra todos los elementos" });
});

router.get('/:id', (req, res) => {
  res.json({ mensaje: `Esta es la ruta GET de mi entidad usuarios con el ID ${req.params.id}` });
});

router.post('/', (req, res) => {
  res.json({ mensaje: "Esta es la ruta POST de mi entidad usuarios" });
});

router.put('/:id', (req, res) => {
  res.json({ mensaje: `Esta es la ruta PUT de mi entidad usuarios con el ID ${req.params.id}` });
});

router.delete('/:id', (req, res) => {
  res.json({ mensaje: `Esta es la ruta DELETE de mi entidad usuarios con el ID ${req.params.id}` });
});


module.exports = router;
