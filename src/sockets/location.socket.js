import locationDao from './location.dao.js';

/**
 * location.socket.js
 *
 * Maneja la ubicación en tiempo real de fotógrafos.
 *
 * Eventos entrantes:
 *   - location:update  { lat, lng }           (fotógrafo → servidor)
 *   - map:join_zone    { zone }               (cliente → servidor)
 *   - map:leave_zone   { zone }               (cliente → servidor)
 *
 * Eventos salientes:
 *   - photographer:moved { id, lat, lng }     (servidor → clientes en zona)
 *
 * Zonificación:
 *   Se usa un grid de ~11km: zone = `${Math.floor(lat*10)}_${Math.floor(lng*10)}`
 *   Los clientes se unen al room de su zona para recibir actualizaciones
 *   solo de fotógrafos cercanos.
 */
export default function locationSocket(io, socket) {

    // Cache del photographerId para este socket (se resuelve una vez)
    let _photographerId = null;

    // ── Fotógrafo envía su ubicación ──────────────────────────────────────
    socket.on('location:update', async (data) => {
        try {
            const { lat, lng } = data;
            if (lat == null || lng == null) return;

            const userId = socket.user?.id;
            if (!userId) return;

            // Resolver photographerId si aún no se tiene
            if (!_photographerId) {
                _photographerId = await locationDao.getPhotographerIdByUserId(userId);
                if (!_photographerId) return;
            }

            // Persistir en BD
            await locationDao.updatePhotographerLocation(_photographerId, lat, lng);

            // Calcular zona y emitir a clientes suscritos
            const zone = `${Math.floor(lat * 10)}_${Math.floor(lng * 10)}`;
            io.to(`map:zone_${zone}`).emit('photographer:moved', {
                id: _photographerId,
                lat,
                lng
            });

            // También emitir a zonas adyacentes (para fotógrafos en el borde)
            const adjacentZones = getAdjacentZones(lat, lng);
            for (const adjZone of adjacentZones) {
                if (adjZone !== zone) {
                    io.to(`map:zone_${adjZone}`).emit('photographer:moved', {
                        id: _photographerId,
                        lat,
                        lng
                    });
                }
            }

        } catch (err) {
            console.error('Error en location:update:', err);
        }
    });

    // ── Cliente se suscribe a una zona del mapa ──────────────────────────
    socket.on('map:join_zone', (data) => {
        try {
            const { zone } = data;
            if (!zone) return;

            // Limpiar zonas anteriores del mapa
            const rooms = Array.from(socket.rooms);
            for (const room of rooms) {
                if (room.startsWith('map:zone_')) {
                    socket.leave(room);
                }
            }

            // Unirse a la nueva zona y adyacentes
            const [latGrid, lngGrid] = zone.split('_').map(Number);
            const zones = getAdjacentZonesFromGrid(latGrid, lngGrid);
            for (const z of zones) {
                socket.join(`map:zone_${z}`);
            }

        } catch (err) {
            console.error('Error en map:join_zone:', err);
        }
    });

    // ── Cliente deja su zona ─────────────────────────────────────────────
    socket.on('map:leave_zone', () => {
        try {
            const rooms = Array.from(socket.rooms);
            for (const room of rooms) {
                if (room.startsWith('map:zone_')) {
                    socket.leave(room);
                }
            }
        } catch (err) {
            console.error('Error en map:leave_zone:', err);
        }
    });
}

/**
 * Calcula las zonas adyacentes (9 celdas del grid) a partir de coordenadas.
 */
function getAdjacentZones(lat, lng) {
    const latGrid = Math.floor(lat * 10);
    const lngGrid = Math.floor(lng * 10);
    return getAdjacentZonesFromGrid(latGrid, lngGrid);
}

function getAdjacentZonesFromGrid(latGrid, lngGrid) {
    const zones = [];
    for (let dLat = -1; dLat <= 1; dLat++) {
        for (let dLng = -1; dLng <= 1; dLng++) {
            zones.push(`${latGrid + dLat}_${lngGrid + dLng}`);
        }
    }
    return zones;
}
