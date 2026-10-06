import { handleCtflSyllabusRequest } from '../../server/ctflSyllabus.js';

export default async function handler(request, response) {
  const handled = await handleCtflSyllabusRequest(
    request,
    (statusCode, body) => response.status(statusCode).json(body),
    (statusCode, pdf) => response
      .status(statusCode)
      .setHeader('Content-Type', 'application/pdf')
      .setHeader('Content-Disposition', `attachment; filename="${pdf.fileName}"`)
      .setHeader('Content-Length', pdf.content.length)
      .setHeader('X-Content-Type-Options', 'nosniff')
      .send(pdf.content),
  );

  if (!handled) {
    response.status(404).json({ success: false, message: 'Rota CTFL não encontrada.' });
  }
}