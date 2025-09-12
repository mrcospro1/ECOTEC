const express = require('express');
const router = express.Router();


router.post('/register', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }
  const hash = await bcrypt.hash(password, 10);

const nuevoUsuario = await prisma.User.create({
  data: {
    username,
    password: hash
  }
});
});
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ mensaje: 'Faltan datos' });
  try {
    const usuario = await prisma.usuario.findUnique({ where: { username } });
    if (!usuario) return res.status(400).json({ mensaje: 'Usuario no encontrado' });

    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) return res.status(400).json({ mensaje: 'Contraseña incorrecta' });

    res.json({ mensaje: 'Login exitoso', usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error en login' });
  }
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
