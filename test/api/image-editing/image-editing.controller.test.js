import assert from 'node:assert';
import ImageEditingController from '../../../src/api/image-editing/controllers/image-editing.controller.js';
import AppError from '../../../src/utils/appError.js';

/**
 * Pruebas de contrato del controlador de edición de imágenes para N1
 * (`remove_object`). NO llaman a proveedores externos ni a Bria y NO requieren
 * `BRIA_API_TOKEN`: el servicio de eliminación de objetos se simula y el camino
 * esperado es HTTP 503 (IMAGE_EDITING_UNAVAILABLE) o la validación 400.
 */

/** Respuesta Express simulada que captura status + json. */
function createRes() {
  return {
    statusCode: null,
    body: null,
    status(code) {
      this.statusCode = code;
      return this;
    },
    json(payload) {
      this.body = payload;
      return this;
    },
  };
}

/** Servicio simulado que lanza el error indicado al editar. */
function makeThrowingService(error) {
  return {
    isAvailable: () => false,
    edit: async () => {
      throw error;
    },
  };
}

/** Servicio simulado que no debería ser llamado en las pruebas de validación. */
const inertService = {
  isAvailable: () => true,
  edit: async () => Buffer.from('no-debe-llamarse'),
};

const imageBytes = Buffer.from('imagen-de-prueba');

console.log('=== Pruebas de contrato del controlador de image-editing (N1) ===\n');

// --- Prueba 1: remove_object sin mask -> HTTP 400 ---
(async () => {
  const controller = new ImageEditingController(inertService, inertService);
  const req = {
    files: { image: [{ buffer: imageBytes, mimetype: 'image/jpeg' }] },
    body: { operation: 'remove_object' },
  };
  const res = createRes();

  await controller.edit(req, res);

  assert.strictEqual(res.statusCode, 400, `esperaba 400, obtuvo ${res.statusCode}`);
  assert.ok(
    res.body && res.body.message === 'mask es obligatorio para eliminación de objetos',
    `mensaje inesperado: ${res.body && res.body.message}`
  );
  console.log('✓ Prueba 1: remove_object sin mask -> 400 con el mensaje esperado');
})();

// --- Prueba 2: remove_object con mask pero servicio 503 -> HTTP 503 ---
(async () => {
  const briaService = makeThrowingService(new AppError('IMAGE_EDITING_UNAVAILABLE', 503));
  const controller = new ImageEditingController(inertService, briaService);
  const req = {
    files: {
      image: [{ buffer: imageBytes, mimetype: 'image/jpeg' }],
      mask: [{ buffer: Buffer.from('mask-png'), mimetype: 'image/png' }],
    },
    body: { operation: 'remove_object' },
  };
  const res = createRes();

  await controller.edit(req, res);

  assert.strictEqual(res.statusCode, 503, `esperaba 503, obtuvo ${res.statusCode}`);
  assert.ok(
    res.body && res.body.message === 'IMAGE_EDITING_UNAVAILABLE',
    `mensaje inesperado: ${res.body && res.body.message}`
  );
  console.log('✓ Prueba 2: remove_object con mask y servicio no disponible -> 503');
})();

// --- Prueba 3: remove_object se enruta al servicio de Bria (no al de PhotoRoom) ---
(async () => {
  const calls = [];
  const photoRoomService = {
    isAvailable: () => true,
    edit: async () => {
      calls.push('photoroom');
      return Buffer.from('photoroom');
    },
  };
  const briaService = {
    isAvailable: () => true,
    edit: async (params) => {
      calls.push('bria');
      assert.ok(params.maskBuffer, 'el servicio de Bria debe recibir el maskBuffer');
      assert.strictEqual(params.operation, 'remove_object');
      return Buffer.from('bria-result');
    },
  };
  const controller = new ImageEditingController(photoRoomService, briaService);
  const req = {
    files: {
      image: [{ buffer: imageBytes, mimetype: 'image/jpeg' }],
      mask: [{ buffer: Buffer.from('mask-png'), mimetype: 'image/png' }],
    },
    body: { operation: 'remove_object' },
  };
  const res = createRes();

  await controller.edit(req, res);

  assert.deepStrictEqual(calls, ['bria'], 'remove_object debe ir solo al servicio de Bria');
  assert.strictEqual(res.statusCode, 200, `esperaba 200, obtuvo ${res.statusCode}`);
  assert.strictEqual(res.body.status, 'success');
  assert.strictEqual(res.body.data.mimeType, 'image/png');
  console.log('✓ Prueba 3: remove_object se enruta al servicio de Bria y responde 200');
})();

// --- Prueba 4: operación PhotoRoom (remove_background) no se rompe y no usa Bria ---
(async () => {
  const calls = [];
  const photoRoomService = {
    isAvailable: () => true,
    edit: async (params) => {
      calls.push('photoroom');
      assert.strictEqual(params.operation, 'remove_background');
      return Buffer.from('photoroom-result');
    },
  };
  const briaService = {
    isAvailable: () => true,
    edit: async () => {
      calls.push('bria');
      return Buffer.from('bria');
    },
  };
  const controller = new ImageEditingController(photoRoomService, briaService);
  const req = {
    files: { image: [{ buffer: imageBytes, mimetype: 'image/jpeg' }] },
    body: { operation: 'remove_background' },
  };
  const res = createRes();

  await controller.edit(req, res);

  assert.deepStrictEqual(calls, ['photoroom'], 'remove_background debe ir solo al servicio PhotoRoom');
  assert.strictEqual(res.statusCode, 200, `esperaba 200, obtuvo ${res.statusCode}`);
  console.log('✓ Prueba 4: remove_background usa PhotoRoom y no Bria (sin regresión)');
})();

console.log('\n=== Todas las pruebas del controlador pasaron ===');
