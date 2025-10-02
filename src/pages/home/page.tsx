
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-gradient-to-br from-green-50 via-blue-50 to-purple-50">
      {/* Hero Section */}
      <div className="relative overflow-hidden">
        <div 
          className="absolute inset-0 bg-cover bg-center bg-no-repeat"
          style={{
            backgroundImage: `url('https://readdy.ai/api/search-image?query=beautiful%20family%20tree%20illustration%20with%20multiple%20generations%2C%20warm%20golden%20lighting%2C%20peaceful%20natural%20background%2C%20soft%20watercolor%20style%2C%20genealogy%20concept%20art%2C%20harmonious%20family%20connections&width=1920&height=1080&seq=9&orientation=landscape')`
          }}
        >
          <div className="absolute inset-0 bg-gradient-to-r from-white/90 to-white/70"></div>
        </div>
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 sm:py-16 lg:py-20">
          <div className="max-w-2xl">
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-800 mb-4 sm:mb-6 leading-tight">
              Preserve a História da Sua Família
            </h1>
            <p className="text-lg sm:text-xl text-gray-600 mb-6 sm:mb-8 leading-relaxed">
              Crie e gerencie sua árvore genealógica de forma simples e segura. 
              Conecte gerações, preserve memórias e mantenha a história familiar viva.
            </p>
            <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4">
              <button
                onClick={() => navigate('/login')}
                className="bg-green-600 text-white px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-green-700 focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors whitespace-nowrap"
              >
                <i className="ri-login-box-line mr-2"></i>
                Acessar Sistema
              </button>
              <button
                onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white text-green-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg border-2 border-green-600 hover:bg-green-50 transition-colors whitespace-nowrap"
              >
                Saiba Mais
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <section id="features" className="py-12 sm:py-16 lg:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
              Funcionalidades Principais
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Tudo que você precisa para gerenciar sua árvore genealógica familiar
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="ri-shield-check-line text-xl sm:text-2xl text-blue-600"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Acesso Seguro</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Sistema de autenticação com confirmação de identidade familiar para máxima segurança
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="ri-family-tree-line text-xl sm:text-2xl text-green-600"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Árvore Genealógica</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Visualização hierárquica completa da família com navegação intuitiva entre gerações
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="ri-user-add-line text-xl sm:text-2xl text-purple-600"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Cadastro Simples</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Adicione novos membros da família com informações completas e fotos
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="ri-image-line text-xl sm:text-2xl text-yellow-600"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Galeria de Fotos</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Upload e gerenciamento de fotos familiares com armazenamento seguro
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="ri-edit-line text-xl sm:text-2xl text-red-600"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Edição Fácil</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Atualize informações pessoais e familiares de forma rápida e intuitiva
              </p>
            </div>

            <div className="bg-gray-50 rounded-xl p-4 sm:p-6 text-center">
              <div className="w-12 h-12 sm:w-16 sm:h-16 bg-indigo-100 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                <i className="ri-smartphone-line text-xl sm:text-2xl text-indigo-600"></i>
              </div>
              <h3 className="text-lg sm:text-xl font-bold text-gray-800 mb-2 sm:mb-3">Responsivo</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Acesse de qualquer dispositivo - computador, tablet ou celular
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12 sm:mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold text-gray-800 mb-3 sm:mb-4">
              Como Funciona
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto">
              Processo simples e seguro para acessar sua árvore genealógica
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-lg sm:text-xl font-bold">
                1
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">Login</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Entre com seu usuário no formato primeiro.sobrenome e senha (inicialmente igual ao usuário)
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-lg sm:text-xl font-bold">
                2
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">Confirmação</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Primeiro acesso: informe data do patriarca. Demais acessos: selecione um dos seus pais entre 5 opções
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-lg sm:text-xl font-bold">
                3
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">Nova Senha</h3>
              <p className="text-sm sm:text-base text-gray-600">
                No primeiro acesso, crie uma nova senha seguindo o padrão: 4 letras + @ ou # + 4 números
              </p>
            </div>

            <div className="text-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-600 text-white rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4 text-lg sm:text-xl font-bold">
                4
              </div>
              <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">Acesso</h3>
              <p className="text-sm sm:text-base text-gray-600">
                Acesse seu dashboard e gerencie a árvore genealógica da família
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-12 sm:py-16 lg:py-20 bg-green-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-2xl sm:text-3xl font-bold text-white mb-3 sm:mb-4">
            Comece Agora a Preservar Sua História Familiar
          </h2>
          <p className="text-lg sm:text-xl text-green-100 mb-6 sm:mb-8 max-w-2xl mx-auto">
            Junte-se à sua família e mantenha as conexões e memórias vivas para as próximas gerações
          </p>
          <button
            onClick={() => navigate('/login')}
            className="bg-white text-green-600 px-6 sm:px-8 py-3 sm:py-4 rounded-lg font-medium text-base sm:text-lg hover:bg-gray-50 focus:ring-2 focus:ring-white focus:ring-offset-2 focus:ring-offset-green-600 transition-colors whitespace-nowrap"
          >
            <i className="ri-arrow-right-line mr-2"></i>
            Acessar Sistema
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-8 sm:py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8">
            <div>
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-600 rounded-full flex items-center justify-center">
                  <i className="ri-family-tree-line text-lg sm:text-xl text-white"></i>
                </div>
                <h3 className="text-lg sm:text-xl font-bold">Árvore Genealógica</h3>
              </div>
              <p className="text-sm sm:text-base text-gray-300">
                Preservando histórias familiares e conectando gerações através da tecnologia.
              </p>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-bold mb-4">Funcionalidades</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-300">
                <li>• Árvore genealógica interativa</li>
                <li>• Cadastro de membros</li>
                <li>• Upload de fotos</li>
                <li>• Acesso seguro</li>
              </ul>
            </div>

            <div>
              <h4 className="text-base sm:text-lg font-bold mb-4">Suporte</h4>
              <ul className="space-y-2 text-sm sm:text-base text-gray-300">
                <li>• Guia de uso</li>
                <li>• Perguntas frequentes</li>
                <li>• Contato técnico</li>
                <li>• Privacidade</li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-700 mt-6 sm:mt-8 pt-6 sm:pt-8 text-center">
            <p className="text-sm sm:text-base text-gray-300">
              © 2025 Sistema de Árvore Genealógica. Todos os direitos reservados. | Powered by ROMA
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
