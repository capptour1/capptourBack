import assert from 'node:assert';
import ImageEditingService from '../../src/services/image-editing.service.js';
import { ImageEditingAdapter } from '../../src/services/image-editing.adapter.js';
import AppError from '../../src/utils/appError.js';

/**
 * Adaptador simulado para pruebas unitarias.
 * Implementa ImageEditingAdapter sin realizar llamadas externas.
 */
class MockAdapter extends ImageEditingAdapter {
  constructor({ available = true, editResult = Buffer.from('fake-image-bytes'), editError = null } = {}) {
    super();
    this.available = available;
    this.editResult = editResult;
    this.editError = editError;
    this.calls = [];
  }

  isAvailable() {
    return this.available;
  }

  async edit(params) {
    this.calls.push(params);
    if (this.editError) {
      throw this.editError;
    }
    return this.editResult;
  }
}

function assertThrowsAsync(fn, expectedConstructor, expectedMessagePart) {
  return assert.rejects(fn, (err) => {
    assert.ok(err instanceof expectedConstructor, `esperaba instancia de ${expectedConstructor.name}, obtuvo ${err.constructor.name}`);
    if (expectedMessagePart) {
      assert.ok(err.message.includes(expectedMessagePart), `esperaba mensaje que contenga "${expectedMessagePart}", obtuvo "${err.message}"`);
    }
    return true;
  });
}

console.log('=== Pruebas unitarias de ImageEditingService ===\n');

// --- Prueba 1: isAvailable() delega al adaptador ---
(async () => {
  const adapter = new MockAdapter({ available: true });
  const service = new ImageEditingService(adapter);
  assert.strictEqual(service.isAvailable(), true, 'isAvailable() debería devolver true cuando el adaptador está disponible');

  const adapterUnavailable = new MockAdapter({ available: false });
  const serviceUnavailable = new ImageEditingService(adapterUnavailable);
  assert.strictEqual(serviceUnavailable.isAvailable(), false, 'isAvailable() debería devolver false cuando el adaptador no está disponible');
  console.log('✓ Prueba 1: isAvailable() delega al adaptador');
})();

// --- Prueba 2: edit() delega al adaptador con los parámetros correctos ---
(async () => {
  const adapter = new MockAdapter({ available: true });
  const service = new ImageEditingService(adapter);

  const params = {
    imageBuffer: Buffer.from('imagen-original'),
    mimeType: 'image/jpeg',
    operation: 'remove_background',
    backgroundAssetBuffer: null,
    backgroundMimeType: null,
    color: null,
    prompt: null,
  };

  const result = await service.edit(params);

  assert.strictEqual(adapter.calls.length, 1, 'debería haber una llamada al adaptador');
  assert.deepStrictEqual(adapter.calls[0], params, 'debería pasar los mismos parámetros al adaptador');
  assert.ok(result.equals(Buffer.from('fake-image-bytes')), 'debería devolver el buffer del adaptador');
  console.log('✓ Prueba 2: edit() delega al adaptador con parámetros correctos');
})();

// --- Prueba 3: edit() lanza AppError 503 cuando el adaptador no está disponible ---
(async () => {
  const adapter = new MockAdapter({ available: false });
  const service = new ImageEditingService(adapter);

  await assertThrowsAsync(
    () => service.edit({
      imageBuffer: Buffer.from('x'),
      mimeType: 'image/png',
      operation: 'remove_background',
    }),
    AppError,
    'IMAGE_EDITING_UNAVAILABLE'
  );
  console.log('✓ Prueba 3: edit() lanza AppError 503 cuando el adaptador no está disponible');
})();

// --- Prueba 4: el constructor valida que el adaptador tenga los métodos requeridos ---
(async () => {
  const adaptadorInvalido = { nombre: 'no es un adaptador' };

  assert.throws(
    () => new ImageEditingService(adaptadorInvalido),
    (err) => {
      assert.ok(err instanceof Error, 'debería lanzar un Error');
      assert.ok(err.message.includes('adaptador'), `el mensaje debería mencionar adaptador, obtuvo "${err.message}"`);
      return true;
    },
    'debería lanzar error cuando el adaptador no cumple la interfaz'
  );
  console.log('✓ Prueba 4: constructor valida que el adaptador tenga los métodos requeridos');
})();

// --- Prueba 5: edit() propaga errores del adaptador ---
(async () => {
  const errorDelProveedor = new Error('PhotoRoom API respondió 500: error interno');
  const adapter = new MockAdapter({ available: true, editError: errorDelProveedor });
  const service = new ImageEditingService(adapter);

  await assertThrowsAsync(
    () => service.edit({
      imageBuffer: Buffer.from('x'),
      mimeType: 'image/png',
      operation: 'remove_background',
    }),
    Error,
    'PhotoRoom API respondió 500'
  );
  console.log('✓ Prueba 5: edit() propaga errores del adaptador');
})();

// --- Prueba 6: edit() funciona con todos los tipos de operación ---
(async () => {
  const adapter = new MockAdapter({ available: true });
  const service = new ImageEditingService(adapter);

  const operaciones = [
    'remove_background',
    'transparent_background',
    'solid_color_background',
    'predesigned_background',
    'text_generated_background',
    'relighting',
  ];

  for (const op of operaciones) {
    const params = {
      imageBuffer: Buffer.from('imagen'),
      mimeType: 'image/png',
      operation: op,
      backgroundAssetBuffer: op === 'predesigned_background' ? Buffer.from('fondo') : null,
      backgroundMimeType: op === 'predesigned_background' ? 'image/png' : null,
      color: op === 'solid_color_background' ? 'FFFFFF' : null,
      prompt: op === 'text_generated_background' ? 'fondo de playa' : null,
    };
    const result = await service.edit(params);
    assert.ok(result.equals(Buffer.from('fake-image-bytes')), `debería devolver resultado para operación ${op}`);
  }
  assert.strictEqual(adapter.calls.length, operaciones.length, 'debería haber una llamada por operación');
  console.log('✓ Prueba 6: edit() funciona con todos los tipos de operación');
})();

console.log('\n=== Todas las pruebas pasaron ===');
