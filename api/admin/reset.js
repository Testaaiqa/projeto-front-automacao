import { getAuthenticatedUserId } from '../../server/auth.js';
import { isMasterUser, resetPlatformData } from '../../server/master.js';

const REQUIRED_CONFIRMATION = 'RESETAR_TODA_A_PLATAFORMA';

export default async function handler(request, response) {
  if (request.method !== 'POST') {
    response.setHeader('Allow', ['POST']);
    response.status(405).json({ success: false, message: 'Método não permitido.' });
    return;
  }

  const userId = getAuthenticatedUserId(request);
  if (!userId) {
    response.status(401).json({ success: false, message: 'Token ausente, inválido ou expirado.' });
    return;
  }

  try {
    if (!(await isMasterUser(userId))) {
      response.status(403).json({ success: false, message: 'Apenas o usuário mestre pode limpar a plataforma.' });
      return;
    }

    if (request.body?.confirmation !== REQUIRED_CONFIRMATION) {
      response.status(400).json({
        success: false,
        message: `Confirme a operação com ${REQUIRED_CONFIRMATION}.`,
      });
      return;
    }

    const masterEmail = process.env.MASTER_USER_EMAIL.trim().toLowerCase();
    const deleted = await resetPlatformData(masterEmail);
    response.status(200).json({ success: true, message: 'Plataforma limpa com sucesso.', deleted });
  } catch (error) {
    console.error('Falha ao limpar a plataforma:', error);
    response.status(503).json({ success: false, message: 'Não foi possível limpar os dados da plataforma.' });
  }
}
