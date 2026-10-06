import { handleCtflSyllabusRequest } from '../../../server/ctflSyllabus.js';

export default async function handler(request, response) {
  const handled = await handleCtflSyllabusRequest(
    request,
    (statusCode, body) => response.status(statusCode).json(body),
  );

  if (!handled) {
    response.status(404).json({ success: false, message: 'Rota CTFL não encontrada.' });
  }
}