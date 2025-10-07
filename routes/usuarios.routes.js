const prisma=require('../prismaModulo')
const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');

router.post('/register', async (req, res) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({ mensaje: 'Faltan datos' });
  }

  try {

    const hash = await bcrypt.hash(password, 10);

    const usuario = await prisma.User.create({
      data: {
        username,
        password: hash,
      },
    });

    res.json({ mensaje: 'Usuario registrado', usuario });
  } catch (err) {
    if (err.code === 'P2002') {
      res.status(400).json({ mensaje: 'El usuario ya existe' });
    } else {
      console.error(err);
      res.status(500).json({ mensaje: 'Error al registrar usuario' });
    }
  }
});
router.post('/login', async (req, res) => {
  const { username, password } = req.body;
  if (!username || !password) return res.status(400).json({ mensaje: 'Faltan datos' });

  try {
    const usuario = await prisma.User.findUnique({ where: { username } });
    if (!usuario) return res.status(400).json({ mensaje: 'Usuario no encontrado' });

    const validPassword = await bcrypt.compare(password, usuario.password);
    if (!validPassword) return res.status(400).json({ mensaje: 'Contraseña incorrecta' });

    res.json({ mensaje: 'Login exitoso', usuario });
  } catch (err) {
    console.error(err);
    res.status(500).json({ mensaje: 'Error en login' });
  }
});

router.post("/importar-excel", async (req, res) => {

  try {
    
    const workbook = XLSX.readFile("datos.xlsx");
    const hoja = workbook.Sheets[workbook.SheetNames[0]];
    const datos = XLSX.utils.sheet_to_json(hoja);

    for (let d of datos) {
      await prisma.usuarios.create({
        data: {
          nombre: d.nombre,
          edad: d.edad,
        },
      });
    }

    res.json({ mensaje: "Datos importados con éxito", registros: datos.length });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error al importar el Excel" });
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
