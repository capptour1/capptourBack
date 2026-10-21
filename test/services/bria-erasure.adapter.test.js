import assert from 'node:assert';
import BriaEraserAdapter, {
  BRIA_ERASE_API_URL,
} from '../../src/services/bria-erasure.adapter.js';

/**
 * Pruebas del adaptador de Bria Eraser.
 *
 * NO llaman a Bria real: se intercepta el método `_fetch` del adaptador para
 * capturar la petición y devolver respuestas simuladas. No requieren ni leen
 * el valor real de `BRIA_API_TOKEN` (se usa un valor de prueba local).
 *
 * El objetivo es garantizar que el adaptador construye EXACTAMENTE la misma
 * estructura de petición que la PoC funcional (`poc-n1-eliminacion-objetos`):
 *   - URL: https://engine.prod.bria-api.com/v2/image/edit/erase
 *   - método POST, cabecera de autenticación `api_token`
 *   - cuerpo JSON con `image`/`mask` en Base64 y `mask_type=manual`
 *   - respuesta JSON con `result.image_url`, que se descarga y se devuelve
 *     como buffer.
 */

/** Crea un adaptador con `_fetch` interceptado y un token de prueba. */
function makeAdapter({ onFetch }) {
  const adapter = new BriaEraserAdapter();
  // Token local de prueba (no es un secreto real).
  process.env.BRIA_API_TOKEN = 'test-token-local';
  adapter._fetch = onFetch;
  return adapter;
}

/** Respuesta fetch simulada. */
function fakeResponse({ ok, status = 200, jsonBody, textBody, buffer }) {
  return {
    ok,
    status,
    async json() {
      return jsonBody;
    },
    async text() {
      return textBody ?? '';
    },
    async buffer() {
      return buffer ?? Buffer.from('');
    },
  };
}

console.log('=== Pruebas unitarias de BriaEraserAdapter ===\n');

// --- Prueba 1: la petición a Bria coincide con la de la PoC funcional ---
(async () => {
  const calls = [];
  const resultBytes = Buffer.from('imagen-resultante-bria');
  const adapter = makeAdapter({
    onFetch: async (url, options) => {
      calls.push({ url, options });
      // Primera llamada: POST /erase → JSON con image_url.
      if (options.method === 'POST') {
        return fakeResponse({
          ok: true,
          status: 200,
          jsonBody: {
            request_id: 'req-123',
            result: { image_url: 'https://cdn.bria.example/result-123.png' },
          },
        });
      }
      // Segunda llamada: GET image_url → bytes de la imagen.
      return fakeResponse({ ok: true, status: 200, buffer: resultBytes });
    },
  });

  const out = await adapter.edit({
    imageBuffer: Buffer.from('bytes-de-imagen'),
    mimeType: 'image/jpeg',
    maskBuffer: Buffer.from('bytes-de-mascara'),
    maskMimeType: 'image/png',
  });

  // 1.1 URL y método del POST.
  const post = calls[0];
  assert.strictEqual(post.url, BRIA_ERASE_API_URL, 'URL del POST debe ser el endpoint de Bria');
  assert.strictEqual(
    post.url,
    'https://engine.prod.bria-api.com/v2/image/edit/erase',
    'URL completa debe coincidir con la PoC',
  );
  assert.strictEqual(post.options.method, 'POST', 'método debe ser POST');

  // 1.2 Autenticación por cabecera `api_token` (no `x-api-key`).
  assert.strictEqual(
    post.options.headers.api_token,
    'test-token-local',
    'debe autenticar con la cabecera api_token',
  );
  assert.strictEqual(
    post.options.headers['x-api-key'],
    undefined,
    'no debe usar la cabecera x-api-key',
  );
  assert.strictEqual(
    post.options.headers['Content-Type'],
    'application/json',
    'Content-Type debe ser application/json',
  );

  // 1.3 Cuerpo JSON con image/mask en Base64 y parámetros de la PoC.
  const body = JSON.parse(post.options.body);
  assert.strictEqual(body.image, Buffer.from('bytes-de-imagen').toString('base64'), 'image debe ir en Base64');
  assert.strictEqual(body.mask, Buffer.from('bytes-de-mascara').toString('base64'), 'mask debe ir en Base64');
  assert.strictEqual(body.mask_type, 'manual', 'mask_type debe ser manual');
  assert.strictEqual(body.composite, true, 'composite debe ser true');
  assert.strictEqual(body.sync, true, 'sync debe ser true');

  // 1.4 Descarga del resultado (GET image_url) y retorno del buffer.
  const get = calls[1];
  assert.strictEqual(get.url, 'https://cdn.bria.example/result-123.png', 'debe descargar result.image_url');
  assert.strictEqual(get.options.method, 'GET', 'la descarga debe ser GET');
  assert.ok(out.equals(resultBytes), 'debe devolver los bytes de la imagen descargada');

  console.log('✓ Prueba 1: la petición coincide con la PoC (URL, api_token, JSON base64, descarga de image_url)');
})();

// --- Prueba 2: un 404 simulado se propaga con status y cuerpo ---
(async () => {
  const adapter = makeAdapter({
    onFetch: async () =>
      fakeResponse({ ok: false, status: 404, textBody: '{"detail":"Not Found"}' }),
  });

  await assert.rejects(
    () =>
      adapter.edit({
        imageBuffer: Buffer.from('x'),
        mimeType: 'image/jpeg',
        maskBuffer: Buffer.from('m'),
        maskMimeType: 'image/png',
      }),
    (err) => {
      assert.ok(err.message.includes('404'), `debe incluir el status 404, obtuvo "${err.message}"`);
      assert.ok(err.message.includes('Not Found'), 'debe incluir el cuerpo del error');
      return true;
    },
  );
  console.log('✓ Prueba 2: un 404 simulado se propaga con status y cuerpo');
})();

// --- Prueba 3: sin BRIA_API_TOKEN lanza 503 y NO llama a la red ---
(async () => {
  let fetchCalled = false;
  const adapter = new BriaEraserAdapter();
  adapter._fetch = async () => {
    fetchCalled = true;
    return fakeResponse({ ok: true, status: 200, jsonBody: {} });
  };
  const prev = process.env.BRIA_API_TOKEN;
  delete process.env.BRIA_API_TOKEN;

  await assert.rejects(
    () =>
      adapter.edit({
        imageBuffer: Buffer.from('x'),
        mimeType: 'image/jpeg',
        maskBuffer: Buffer.from('m'),
        maskMimeType: 'image/png',
      }),
    (err) => {
      assert.strictEqual(err.statusCode, 503, 'debe ser 503');
      assert.ok(err.message.includes('IMAGE_EDITING_UNAVAILABLE'), 'mensaje IMAGE_EDITING_UNAVAILABLE');
      return true;
    },
  );
  assert.strictEqual(fetchCalled, false, 'no debe llamar a la red sin token');
  if (prev !== undefined) process.env.BRIA_API_TOKEN = prev;
  console.log('✓ Prueba 3: sin token lanza 503 sin tocar la red');
})();

// --- Prueba 4: respuesta 200 sin result.image_url se trata como inesperada ---
(async () => {
  const adapter = makeAdapter({
    onFetch: async () =>
      fakeResponse({ ok: true, status: 200, jsonBody: { request_id: 'x', result: {} } }),
  });

  await assert.rejects(
    () =>
      adapter.edit({
        imageBuffer: Buffer.from('x'),
        mimeType: 'image/jpeg',
        maskBuffer: Buffer.from('m'),
        maskMimeType: 'image/png',
      }),
    (err) => {
      assert.ok(err.message.includes('inesperada'), `debe indicar respuesta inesperada, obtuvo "${err.message}"`);
      return true;
    },
  );
  console.log('✓ Prueba 4: 200 sin image_url se trata como respuesta inesperada');
})();

console.log('\n=== Todas las pruebas pasaron ===');
