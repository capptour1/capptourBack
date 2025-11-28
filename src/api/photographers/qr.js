import express from 'express';
import QRCode from 'qrcode';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { SesionFotoInmediata, FotoSesionInmediata, Usuario, sequelize } from '../../models/index.js';
import { Op } from 'sequelize';

const router = express.Router();

// Middleware de autenticación
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({
            success: false,
            mensaje: 'Token de acceso requerido'
        });
    }

    jwt.verify(token, process.env.JWT_SECRET || 'secret_key', (err, user) => {
        if (err) {
            return res.status(403).json({
                success: false,
                mensaje: 'Token inválido'
            });
        }
        req.user = user;
        next();
    });
};

// Endpoint para generar QR de foto inmediata
router.post('/generar-qr', authenticateToken, async (req, res) => {
    try {
        const { cliente_id, duracion_minutos = 5 } = req.body;
        const userId = req.user.userId;

        console.log('Usuario autenticado:', req.user);
        console.log('Cliente ID solicitado:', cliente_id);

        if (userId != cliente_id) {
            return res.status(403).json({
                success: false,
                mensaje: 'No autorizado'
            });
        }

        // Verificar que el cliente existe
        const cliente = await Usuario.findByPk(cliente_id);
        if (!cliente) {
            return res.status(404).json({
                success: false,
                mensaje: 'Cliente no encontrado'
            });
        }

        const token = crypto.randomBytes(32).toString('hex');
        const expiresAt = new Date(Date.now() + duracion_minutos * 60 * 1000);

        // Crear sesión usando Sequelize
        await SesionFotoInmediata.create({
            token,
            cliente_id,
            expires_at: expiresAt
        });

        const qrData = {
            token: token,
            cliente_id: cliente_id,
            expires_at: expiresAt.toISOString(),
            tipo: 'foto_inmediata'
        };

        console.log(qrData);

        const qrImage = await QRCode.toDataURL(JSON.stringify(qrData), {
            width: 300,
            margin: 2,
            color: {
                dark: '#3F1D8C',
                light: '#FFFFFF'
            }
        });

        res.json({
            success: true,
            qr_data: JSON.stringify(qrData),
            qr_image: qrImage,
            expires_at: expiresAt.toISOString(),
            token: token,
            mensaje: 'QR temporal generado correctamente'
        });

    } catch (error) {
        console.error('Error generando QR:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor'
        });
    }
});

// Validar QR Code
router.post('/foto-inmediata/validar-qr', authenticateToken, async (req, res) => {
    try {
        const { qr_data, colaborador_id } = req.body;
        const userId = req.user.id || req.user.userId;

        if (userId != colaborador_id) {
            return res.status(403).json({
                valido: false,
                mensaje: 'No autorizado'
            });
        }

        let qrInfo;
        try {
            qrInfo = JSON.parse(qr_data);
        } catch (error) {
            return res.json({
                valido: false,
                mensaje: 'Formato de QR inválido'
            });
        }

        const now = new Date();
        const expiresAt = new Date(qrInfo.expires_at);

        if (now > expiresAt) {
            return res.json({
                valido: false,
                mensaje: 'El código QR ha expirado'
            });
        }

        // Buscar sesión con Sequelize
        const sesion = await SesionFotoInmediata.findOne({
            where: {
                token: qrInfo.token,
                estado: 'activa'
            },
            include: [{
                model: Usuario,
                as: 'cliente',
                attributes: ['nombre']
            }]
        });

        if (!sesion) {
            return res.json({
                valido: false,
                mensaje: 'Sesión no encontrada o inactiva'
            });
        }

        res.json({
            valido: true,
            sesion_id: qrInfo.token,
            cliente_id: qrInfo.cliente_id,
            cliente_nombre: sesion.cliente.nombre,
            expires_at: qrInfo.expires_at,
            mensaje: 'QR válido'
        });

    } catch (error) {
        console.error('Error validando QR:', error);
        res.status(500).json({
            valido: false,
            mensaje: 'Error interno del servidor'
        });
    }
});

// Iniciar sesión de fotos
router.post('/foto-inmediata/iniciar-sesion', authenticateToken, async (req, res) => {
    try {
        const { token, cliente_id, colaborador_id } = req.body;
        const userId = req.user.id || req.user.userId;

        if (userId != colaborador_id) {
            return res.status(403).json({
                success: false,
                mensaje: 'No autorizado'
            });
        }

        // Verificar sesión activa
        const sesion = await SesionFotoInmediata.findOne({
            where: {
                token: token,
                estado: 'activa',
                expires_at: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!sesion) {
            return res.json({
                success: false,
                mensaje: 'Sesión no encontrada o expirada'
            });
        }

        // Actualizar sesión
        await sesion.update({
            colaborador_id: colaborador_id,
            fecha_inicio: new Date()
        });

        // Obtener datos del cliente
        const cliente = await Usuario.findByPk(cliente_id, {
            attributes: ['id', 'nombre', 'email']
        });

        res.json({
            success: true,
            sesion: {
                id: token,
                cliente_id: cliente_id,
                colaborador_id: colaborador_id,
                estado: 'activa',
                fecha_inicio: new Date().toISOString(),
                expires_at: sesion.expires_at
            },
            cliente: {
                id: cliente_id,
                nombre: cliente?.nombre || 'Cliente'
            },
            mensaje: 'Sesión iniciada correctamente'
        });

    } catch (error) {
        console.error('Error iniciando sesión:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor'
        });
    }
});

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadDir = 'uploads/fotos-inmediatas/';
        if (!fs.existsSync(uploadDir)) {
            fs.mkdirSync(uploadDir, { recursive: true });
        }
        cb(null, uploadDir);
    },
    filename: (req, file, cb) => {
        const uniqueName = `foto_${Date.now()}_${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Solo se permiten archivos de imagen'));
        }
    }
});

// Subir foto
router.post('/foto-inmediata/subir-foto', authenticateToken, upload.single('foto'), async (req, res) => {
    const transaction = await sequelize.transaction();

    try {
        const { sesion_token } = req.body;
        const userId = req.user.id || req.user.userId;

        if (!req.file) {
            return res.status(400).json({
                success: false,
                mensaje: 'No se recibió ningún archivo'
            });
        }

        // Verificar sesión
        const sesion = await SesionFotoInmediata.findOne({
            where: {
                token: sesion_token,
                colaborador_id: userId,
                estado: 'activa',
                expires_at: {
                    [Op.gt]: new Date()
                }
            }
        });

        if (!sesion) {
            fs.unlinkSync(req.file.path);
            return res.json({
                success: false,
                mensaje: 'Sesión no encontrada, expirada o no autorizada'
            });
        }

        const fotoUrl = `${req.protocol}://${req.get('host')}/uploads/fotos-inmediatas/${req.file.filename}`;

        // Crear registro de foto
        const foto = await FotoSesionInmediata.create({
            sesion_token: sesion_token,
            foto_url: fotoUrl
        }, { transaction });

        // Actualizar contador de fotos
        await sesion.increment('fotos_subidas', { transaction });

        await transaction.commit();

        res.json({
            success: true,
            foto: {
                id: foto.id,
                url: fotoUrl,
                sesion_token: sesion_token,
                fecha_subida: new Date().toISOString()
            },
            mensaje: 'Foto subida correctamente'
        });

    } catch (error) {
        await transaction.rollback();
        console.error('Error subiendo foto:', error);

        if (req.file) {
            fs.unlinkSync(req.file.path);
        }

        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor'
        });
    }
});

// Obtener estado de sesión temporal
router.get('/foto-inmediata/estado-sesion', authenticateToken, async (req, res) => {
    try {
        const { token } = req.query;
        const userId = req.user.id || req.user.userId;

        if (!token) {
            return res.status(400).json({
                success: false,
                mensaje: 'Token de sesión requerido'
            });
        }

        // Buscar sesión
        const sesion = await SesionFotoInmediata.findOne({
            where: {
                token: token
            },
            include: [
                {
                    model: Usuario,
                    as: 'cliente',
                    attributes: ['id', 'nombre_completo']
                },
                {
                    model: Usuario,
                    as: 'colaborador',
                    attributes: ['id', 'nombre_completo'],
                    required: false
                }
            ]
        });
       console.log(sesion)
        if (!sesion) {
            return res.json({
                success: false,
                mensaje: 'Sesión no encontrada'
            });
        }

        // Verificar autorización (cliente o colaborador)
        const esCliente = sesion.cliente_id === userId;
        const esColaborador = sesion.colaborador_id === userId;

        if (!esCliente && !esColaborador) {
            return res.status(403).json({
                success: false,
                mensaje: 'No autorizado para ver esta sesión'
            });
        }

        // Calcular tiempo restante
        const ahora = new Date();
        const expira = new Date(sesion.expires_at);
        const tiempoRestanteMs = expira.getTime() - ahora.getTime();
        const tiempoRestanteMinutos = Math.max(0, Math.ceil(tiempoRestanteMs / (1000 * 60)));

        // Determinar estado
        let estadoActual = sesion.estado;
        if (ahora > expira && estadoActual === 'activa') {
            estadoActual = 'expirada';
            // Actualizar en BD
            await sesion.update({ estado: 'expirada' });
        }

        // Contar fotos de la sesión
        const totalFotos = await FotoSesionInmediata.count({
            where: {
                sesion_token: token
            }
        });

        res.json({
            success: true,
            sesion: {
                token: sesion.token,
                estado: estadoActual,
                cliente_id: sesion.cliente_id,
                cliente_nombre: sesion.cliente?.nombre || 'Cliente',
                colaborador_asignado: !!sesion.colaborador_id,
                colaborador_id: sesion.colaborador_id,
                colaborador_nombre: sesion.colaborador?.nombre || null,
                fotos_subidas: totalFotos,
                tiempo_restante_minutos: tiempoRestanteMinutos,
                fecha_creacion: sesion.created_at || null,
                fecha_inicio: sesion.fecha_inicio,
                fecha_expiracion: sesion.expires_at
            },
            mensaje: 'Estado obtenido correctamente'
        });

    } catch (error) {
        console.error('Error obteniendo estado de sesión:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor'
        });
    }
});

// Finalizar sesión
router.post('/foto-inmediata/finalizar-sesion', authenticateToken, async (req, res) => {
    try {
        const { sesion_token } = req.body;
        const userId = req.user.id || req.user.userId;

        // Buscar sesión activa
        const sesion = await SesionFotoInmediata.findOne({
            where: {
                token: sesion_token,
                colaborador_id: userId,
                estado: 'activa'
            }
        });

        if (!sesion) {
            return res.json({
                success: false,
                mensaje: 'Sesión no encontrada o no autorizada'
            });
        }

        // Calcular duración
        const duracionMinutos = sesion.fecha_inicio
            ? Math.round((new Date() - new Date(sesion.fecha_inicio)) / (1000 * 60))
            : 0;

        // Finalizar sesión
        await sesion.update({
            estado: 'finalizada',
            fecha_finalizacion: new Date()
        });

        res.json({
            success: true,
            resumen: {
                fotos_subidas: sesion.fotos_subidas,
                duracion_minutos: duracionMinutos,
                estado_final: 'completada'
            },
            mensaje: 'Sesión finalizada correctamente'
        });

    } catch (error) {
        console.error('Error finalizando sesión:', error);
        res.status(500).json({
            success: false,
            mensaje: 'Error interno del servidor'
        });
    }
});

export default router;