import { handleBankingRequest } from '../../server/banking.js';

function sendJson(response, statusCode, body) {
  response.status(statusCode).json(body);
}

export default async function handler(request, response) {
  try {
    const queryPath = request.query?.path;
    const urlPath = request.url?.split('?')[0].replace(/^\/api\/banking\/?/, '') || '';
    const routePath = Array.isArray(queryPath)
      ? queryPath.join('/')
      : queryPath || urlPath;

    // `request` é um objeto do runtime do Vercel. Propriedades como
    // `headers` podem vir do protótipo e não são preservadas por `{ ...request }`.
    // Encaminhe explicitamente os dados usados pelo módulo bancário para que o
    // token Bearer chegue à validação de autenticação.
    const bankingRequest = {
      method: request.method,
      headers: request.headers || {},
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
  } catch (error) {
    console.error('Falha na função bancária:', error);
    sendJson(response, 503, {
      success: false,
      message: 'Banco de dados indisponível. Verifique DATABASE_URL no Vercel.',
    });
  }
}
