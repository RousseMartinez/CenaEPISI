import { getStore } from '@netlify/blobs';

function result(message, status) {
  return Response.json({ message }, { status, headers: { 'Cache-Control': 'no-store' } });
}

export default async function listGuests(request) {
  if (request.method !== 'GET') return result('Método no permitido.', 405);
  try {
    const store = getStore({name: 'confirmaciones', consistency: 'strong'});
    const {blobs} = await store.list();
    const names = [];
    let total = 0;
    // Limit simultaneous reads so the list can grow without a request burst.
    for (let i = 0; i < blobs.length; i += 16) {
      const records = await Promise.all(blobs.slice(i, i + 16)
        .map(({key}) => store.get(key, {type: 'json'})));
      for (const record of records) {
        if (!record) continue;
        total++;
        if (record.visible) names.push(record.nombre);
      }
    }
    names.sort((first, second) => first.localeCompare(second, 'es'));
    return Response.json({total, names}, {headers: {'Cache-Control': 'no-store'}});
  } catch (error) {
    console.error('No se pudo cargar la lista de invitados', error);
    return result('La lista no está disponible en este momento.', 503);
  }
}
