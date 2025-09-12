const express = require('express');
const router = express.Router();

router.post('/register', async (req, res) => {
    const {consulta, contacto}=req.body;
    const nuevaConsulta= await Prisma.Consulta.create({
        data:{
            contacto:`${contacto}`,
            mensaje:`${consulta}`
        }
    })
    res.json({});
});
module.exports = router;