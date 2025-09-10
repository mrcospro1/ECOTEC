const express = require('express');
const router = express.Router();


router.post('/register', async (req, res) => {
  const { username, email, password } = req.body;
  const user = await prisma.usuario.create({
    data: { username, email, password }
  });
  res.json(user);
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
