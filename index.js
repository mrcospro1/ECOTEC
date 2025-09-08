const express = require('express');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors'); // Para permitir peticiones desde el frontend

const prisma = new PrismaClient();
const app = express();
const PORT = 3000;
// Clave secreta para firmar los JWT. ¡Cámbiala en producción!
const JWT_SECRET = process.env.JWT_SECRET || 'mi_clave_ultra_secreta_123';

// Middleware
app.use(express.json());
app.use(cors());

// ========================================================
// RUTA DE REGISTRO
// ========================================================
app.post('/register', async (req, res) => {
    const { email, password, name } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    try {
        // 1. Verificar si el usuario ya existe
        const existingUser = await prisma.user.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(409).json({ error: 'El usuario con ese email ya existe.' });
        }

        // 2. Hashear la contraseña (bcrypt)
        // 10 es un buen número de saltos para el hash
        const hashedPassword = await bcrypt.hash(password, 10);

        // 3. Crear el nuevo usuario en la DB (Prisma)
        const user = await prisma.user.create({
            data: {
                email,
                password: hashedPassword, // Almacenamos el hash
                name: name || null,
            },
            select: { id: true, email: true, name: true }, // No devolver la contraseña
        });

        res.status(201).json({ message: 'Registro exitoso.', user });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        res.status(500).json({ error: 'Error interno del servidor durante el registro.' });
    }
});

// ========================================================
// RUTA DE INICIO DE SESIÓN
// ========================================================
app.post('/login', async (req, res) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return res.status(400).json({ error: 'Email y contraseña son obligatorios' });
    }

    try {
        // 1. Buscar el usuario
        const user = await prisma.user.findUnique({ where: { email } });
        if (!user) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 2. Comparar la contraseña hasheada
        const isPasswordValid = await bcrypt.compare(password, user.password);
        if (!isPasswordValid) {
            return res.status(401).json({ error: 'Credenciales inválidas.' });
        }

        // 3. Generar un JWT (Token)
        // El token contiene el ID del usuario.
        const token = jwt.sign(
            { userId: user.id, email: user.email },
            JWT_SECRET,
            { expiresIn: '1h' } // El token expira en 1 hora
        );

        // 4. Devolver el token y la información básica del usuario
        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            token,
            user: { id: user.id, email: user.email, name: user.name }
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        res.status(500).json({ error: 'Error interno del servidor durante el inicio de sesión.' });
    }
});

// ========================================================
// Iniciar Servidor
// ========================================================
app.listen(PORT, () => {
    console.log(`Servidor de autenticación corriendo en http://localhost:${PORT}`);
});