import { handleBankingRequest } from '../../server/banking.js';

function sendJson(response, statusCode, body) {
  response.status(statusCode).json(body);
}

export default async function handler(request, response) {
  const routePath = Array.isArray(request.query.path)
    ? request.query.path.join('/')
    : request.query.path || '';

  const bankingRequest = {
    ...request,
    url: `/banking/${routePath}`,
  };

  const handled = await handleBankingRequest(
    bankingRequest,
    (statusCode, body) => sendJson(response, statusCode, body),
    async () => request.body || {},
  );

  if (!handled) {
    sendJson(response, 404, { success: false, message: 'Rota bancária não encontrada.' });
  }
}