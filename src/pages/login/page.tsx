
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { FamilyService } from '../../services/familyService';

export default function Login() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showHelpModal, setShowHelpModal] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Verificação do usuário administrativo
      if (username === 'maurilio.alves' && password === '23311913mmmN') {
        localStorage.setItem('user', username);
        localStorage.setItem('userType', 'admin');
        navigate('/dashboard');
        return;
      }

      // Buscar usuário no Supabase
      const user = await FamilyService.getUserByUsername(username.toLowerCase());
      
      if (!user) {
        setError('Usuário não encontrado no sistema. Entre em contato com o administrador pelo WhatsApp: (61) 9 8578-4500');
        return;
      }

      // Verificar se o usuário está bloqueado
      if (user.is_blocked) {
        setError('Sua conta está bloqueada devido a múltiplas tentativas incorretas. Entre em contato com o administrador pelo WhatsApp: (61) 9 8578-4500');
        return;
      }

      // Validar senha
      let isPasswordValid = false;
      
      if (user.password_hash) {
        // Usuário já alterou a senha - verificar senha personalizada
        isPasswordValid = password === user.password_hash; // Em produção, usar hash
      } else {
        // Primeiro login - verificar senha padrão (igual ao usuário)
        isPasswordValid = password === username.toLowerCase();
      }

      if (!isPasswordValid) {
        // Incrementar tentativas falhadas
        const newAttempts = (user.failed_attempts || 0) + 1;
        await FamilyService.updateFailedAttempts(user.id, newAttempts);
        
        if (newAttempts >= 3) {
          setError('Sua conta foi bloqueada devido a múltiplas tentativas incorretas. Entre em contato com o administrador pelo WhatsApp: (61) 9 8578-4500');
        } else {
          setError(`Senha incorreta. Tentativa ${newAttempts} de 3. ${3 - newAttempts} tentativas restantes.`);
        }
        return;
      }

      // Login bem-sucedido - resetar tentativas
      await FamilyService.resetFailedAttempts(user.id);

      // Salvar dados na sessão
      localStorage.setItem('user', username);
      localStorage.setItem('userType', user.user_type);
      localStorage.setItem('userFamily', user.family_id || '');
      localStorage.setItem('userId', user.id);
      
      if (user.user_type === 'admin') {
        navigate('/dashboard');
      } else {
        navigate('/confirm-identity');
      }
    } catch (err) {
      console.error('Erro no login:', err);
      setError('Erro ao fazer login. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 to-blue-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-6 sm:p-8 w-full max-w-md">
        <div className="text-center mb-6 sm:mb-8">
          <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
            <i className="ri-family-tree-line text-xl sm:text-2xl text-green-600"></i>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">Árvore Genealógica</h1>
          <p className="text-sm sm:text-base text-gray-600">Entre com suas credenciais familiares</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4 sm:space-y-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Usuário
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-user-line text-gray-400"></i>
              </div>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                placeholder="primeiro.sobrenome"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Senha
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <i className="ri-lock-line text-gray-400"></i>
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 sm:py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent text-sm sm:text-base"
                placeholder="primeiro.sobrenome ou senha personalizada"
                required
              />
            </div>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
              <div className="flex items-start space-x-3">
                <i className="ri-error-warning-line text-red-500 text-lg flex-shrink-0 mt-0.5"></i>
                <div>
                  <p className="text-red-600 text-sm font-medium mb-1">Erro de Acesso</p>
                  <p className="text-red-600 text-sm">{error}</p>
                  {error.includes('WhatsApp') && (
                    <div className="mt-3">
                      <a
                        href="https://wa.me/5561985784500"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        <i className="ri-whatsapp-line mr-2"></i>
                        Contatar Administrador
                      </a>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white py-2.5 sm:py-3 px-4 rounded-lg font-medium hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors disabled:opacity-50 whitespace-nowrap text-sm sm:text-base"
          >
            {loading ? 'Entrando...' : 'Entrar'}
          </button>
        </form>

        <div className="mt-4 sm:mt-6 text-center space-y-3">
          <button
            onClick={() => setShowHelpModal(true)}
            className="text-green-600 hover:text-green-700 font-medium text-sm transition-colors whitespace-nowrap"
          >
            <i className="ri-question-line mr-1"></i>
            Como Acesso
          </button>
          <p className="text-sm text-gray-600">
            Acesso administrativo ou familiar
          </p>
        </div>
      </div>

      {/* Modal de Ajuda */}
      {showHelpModal && (
        <div className="fixed inset-0 bg-black bg-black/50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-4 sm:p-6">
              <div className="flex items-center justify-between mb-4 sm:mb-6">
                <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Como Fazer Seu Primeiro Acesso</h2>
                <button
                  onClick={() => setShowHelpModal(false)}
                  className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <i className="ri-close-line text-xl"></i>
                </button>
              </div>

              <div className="space-y-4 sm:space-y-6">
                {/* Passo 1 */}
                <div className="flex space-x-3 sm:space-x-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">Primeiro Acesso</h3>
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">
                      No primeiro login, use seu nome no formato: <strong>primeiro.sobrenome</strong>
                    </p>
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">
                      A senha inicial é <strong>igual ao seu usuário</strong>
                    </p>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <p className="text-xs sm:text-sm text-gray-700">
                        <strong>Exemplo:</strong> Se você é João Silva<br/>
                        Usuário: <code className="bg-gray-200 px-1 rounded">joao.silva</code><br/>
                        Senha: <code className="bg-gray-200 px-1 rounded">joao.silva</code>
                      </p>
                    </div>
                  </div>
                </div>

                {/* Passo 2 */}
                <div className="flex space-x-3 sm:space-x-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">Confirmação de Identidade</h3>
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">
                      Após o login, você precisará confirmar sua identidade:
                    </p>
                    <ul className="text-xs sm:text-sm text-gray-600 space-y-1 ml-4">
                      <li>• <strong>Primeiro login:</strong> Informe apenas a data de nascimento do patriarca da família</li>
                      <li>• <strong>Logins seguintes:</strong> Selecione um dos seus pais entre 5 opções aleatórias e informe sua própria data de nascimento</li>
                    </ul>
                  </div>
                </div>

                {/* Passo 3 */}
                <div className="flex space-x-3 sm:space-x-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">Alteração de Senha Obrigatória</h3>
                    <p className="text-gray-600 mb-2 text-sm sm:text-base">
                      Apenas no primeiro acesso, você será obrigado a criar uma nova senha seguindo o padrão:
                    </p>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                      <p className="text-xs sm:text-sm text-blue-800 font-medium mb-1">Padrão da Nova Senha:</p>
                      <p className="text-xs sm:text-sm text-blue-700">4 letras + 1 caractere especial (@ ou #) + 4 números</p>
                      <p className="text-xs sm:text-sm text-blue-700"><strong>Exemplo:</strong> abcd@1234</p>
                    </div>
                  </div>
                </div>

                {/* Passo 4 */}
                <div className="flex space-x-3 sm:space-x-4">
                  <div className="w-6 h-6 sm:w-8 sm:h-8 bg-green-600 text-white rounded-full flex items-center justify-center text-xs sm:text-sm font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-800 mb-2 text-sm sm:text-base">Acesso ao Sistema</h3>
                    <p className="text-gray-600 text-sm sm:text-base">
                      Após a confirmação de identidade e alteração da senha (se primeiro acesso), você terá acesso completo ao sistema para visualizar e gerenciar a árvore genealógica da família.
                    </p>
                  </div>
                </div>

                {/* Segurança */}
                <div className="bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-3">
                    <i className="ri-shield-line text-red-600 text-lg flex-shrink-0 mt-0.5"></i>
                    <div>
                      <h4 className="font-bold text-red-800 mb-2 text-sm sm:text-base">Segurança</h4>
                      <ul className="text-xs sm:text-sm text-red-700 space-y-1">
                        <li>• Você tem apenas 3 tentativas para fazer login</li>
                        <li>• Após 3 tentativas incorretas, sua conta será bloqueada</li>
                        <li>• Se bloqueado, entre em contato com quem fez seu cadastro</li>
                        <li>• Mantenha suas credenciais seguras</li>
                      </ul>
                    </div>
                  </div>
                </div>

                {/* Exemplo Completo */}
                <div className="bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-3">
                    <i className="ri-user-line text-green-600 text-lg flex-shrink-0 mt-0.5"></i>
                    <div>
                      <h4 className="font-bold text-green-800 mb-2 text-sm sm:text-base">Exemplo Completo</h4>
                      <div className="text-xs sm:text-sm text-green-700 space-y-2">
                        <p><strong>Nome completo:</strong> Jose Barbosa da Silva Pinheiro</p>
                        <p><strong>Usuário:</strong> jose.pinheiro</p>
                        <p><strong>Senha inicial:</strong> jose.pinheiro</p>
                        <p><strong>Nova senha (exemplo):</strong> jose@1234</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Contato do Administrador */}
                <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 sm:p-4">
                  <div className="flex items-start space-x-3">
                    <i className="ri-whatsapp-line text-orange-600 text-lg flex-shrink-0 mt-0.5"></i>
                    <div>
                      <h4 className="font-bold text-orange-800 mb-2 text-sm sm:text-base">Precisa de Ajuda?</h4>
                      <p className="text-xs sm:text-sm text-orange-700 mb-3">
                        Se você não conseguir acessar, foi bloqueado ou não está cadastrado no sistema, entre em contato:
                      </p>
                      <a
                        href="https://wa.me/5561985784500"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm font-medium hover:bg-green-700 transition-colors whitespace-nowrap"
                      >
                        <i className="ri-whatsapp-line mr-2"></i>
                        WhatsApp: (61) 9 8578-4500
                      </a>
                    </div>
                  </div>
                </div>

                {/* Botão de Fechar */}
                <div className="flex justify-end pt-4">
                  <button
                    onClick={() => setShowHelpModal(false)}
                    className="bg-green-600 text-white px-4 sm:px-6 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                  >
                    Entendi
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
