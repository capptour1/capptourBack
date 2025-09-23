// POST /api/photographers/qr/generate
router.post('/generate', async (req, res) => {
    try {
        if (!req.user) {
            return res.status(401).json({ error: 'Usuario no autenticado' });
        }

        if (req.user.role !== 5) {
            console.log('🚫 Acceso denegado. Rol recibido:', req.user.role);
            return res.status(403).json({ error: 'Acceso denegado. Solo fotógrafos pueden generar QR' });
        }

        const usuarioId = req.user.userId; // Este es 35
        console.log('📸 Generando QR para usuario_id:', usuarioId);

        const query = `
            SELECT 
                f.id as fotografo_id, 
                f.usuario_id,  // ← IMPORTANTE: incluir usuario_id
                u.nombre_completo AS nombre,
                u.email 
            FROM fotografo.fotografos f
            INNER JOIN auth.usuarios u ON f.usuario_id = u.id
            WHERE f.usuario_id = $1
        `;

        const result = await db.query(query, [usuarioId]);

        if (result.rows.length === 0) {
            console.log('❌ Fotógrafo no encontrado para usuario_id:', usuarioId);
            return res.status(404).json({ message: 'Fotógrafo no encontrado' });
        }

        const fotografo = result.rows[0];
        console.log('✅ Fotógrafo encontrado:', fotografo);

        // ✅ CORREGIR: Usar usuario_id en lugar de fotografo_id
        const qrData = JSON.stringify({
            usuario_id: fotografo.usuario_id, // ← Cambiar a usuario_id (35)
            action: 'foto_inmediata',
            timestamp: new Date().getTime()
        });

        const qrImage = await QRCode.toDataURL(qrData);

        console.log('✅ QR generado exitosamente para usuario ID:', fotografo.usuario_id);

        res.status(200).json({
            success: true,
            qr: qrImage,
            fotografo: {
                id: fotografo.usuario_id, // ← Devolver usuario_id también
                fotografo_id: fotografo.fotografo_id, // ← Y el fotografo_id por si acaso
                nombre: fotografo.nombre,
                email: fotografo.email
            }
        });
    } catch (err) {
        console.error('❌ Error generando QR:', err.stack);
        res.status(500).json({
            success: false,
            message: 'Error interno del servidor.'
        });
    }
});