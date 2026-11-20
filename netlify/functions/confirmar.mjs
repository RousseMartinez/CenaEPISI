import { getStore } from '@netlify/blobs';

function result(message, status) {
  return Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default async function confirm(request) {
  if (request.method !== 'POST') return result('Método no permitido.', 405);
  if (!request.headers.get('content-type')?.startsWith('application/json')) {
    return result('Formato de envío inválido.', 415);
  }

  let fields;
  try {
    const raw = await request.text();
    if (raw.length > 2048) return result('El formulario supera el tamaño permitido.', 413);
    fields = JSON.parse(raw);
  } catch {
    return result('El formulario no se pudo leer.', 400);
  }

  const name = typeof fields?.nombre === 'string' ? fields.nombre.trim() : '';
  const song = typeof fields?.cancion === 'string' ? fields.cancion.trim() : '';
  if (name.length < 2 || name.length > 100 || song.length > 150 ||
      typeof fields?.id !== 'string' || !/^[a-f0-9]{8}(-[a-f0-9]{4}){3}-[a-f0-9]{12}$/i.test(fields.id)) {
    return result('Revisa el nombre y la longitud de tu sugerencia.', 400);
  }

  try {
    const store = getStore({name: 'confirmaciones', consistency: 'strong'});
    await store.setJSON(fields.id.toLowerCase(), {
      nombre: name,
      cancion: song,
      actualizado_en: new Date().toISOString(),
      visible: fields.visible === '1'
    });
    return result('Confirmación guardada.', 200);
  } catch (error) {
    console.error('No se pudo guardar la confirmación', error);
    return result('El servicio no está disponible en este momento. Intenta de nuevo.', 503);
  }
}

