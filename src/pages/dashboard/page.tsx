
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import FamilyTree from './components/FamilyTree';
import PersonProfile from './components/PersonProfile';
import AddPersonModal from './components/AddPersonModal';
import UserManagementModal from './components/UserManagementModal';
import HierarchicalFamilyTree from './components/HierarchicalFamilyTree';
import BirthdayNotifications from '../../components/feature/BirthdayNotifications';
import { FamilyService } from '../../services/familyService';

interface Family {
  id: string;
  name: string;
  family_members?: any[];
  members?: number;
  created_at?: string;
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState<'tree' | 'profile' | 'family' | 'admin'>('tree');
  const [showAddModal, setShowAddModal] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentFamily, setCurrentFamily] = useState<string>('');
  const [families, setFamilies] = useState<Family[]>([]);
  const [statistics, setStatistics] = useState({ totalFamilies: 0, totalMembers: 0 });
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'testing' | 'connected' | 'error'>('testing');
  const navigate = useNavigate();

  useEffect(() => {
    const userType = localStorage.getItem('userType');
    const user = localStorage.getItem('user');
    
    console.log('Debug - userType:', userType);
    console.log('Debug - user data:', user);
    
    // Verificar se é admin baseado no userType ou se não tem member_id
    let isUserAdmin = false;
    if (userType === 'admin') {
      isUserAdmin = true;
    } else if (user) {
      // CORREÇÃO: Verificar se o valor é um JSON válido antes de tentar parsear
      try {
        // Se o valor começa com '{', é provável que seja JSON
        if (user.startsWith('{')) {
          const userData = JSON.parse(user);
          // Se não tem member_id, é admin
          if (!userData.member_id) {
            isUserAdmin = true;
          }
        } else {
          // Se não é JSON, é apenas o username (string simples)
          console.log('User data é uma string simples (username):', user);
          // Neste caso, não é admin (admin seria identificado pelo userType)
        }
      } catch (error) {
        console.error('Erro ao parsear dados do usuário:', error);
        // Se der erro no parse, tratar como string simples
        console.log('Tratando como username simples:', user);
      }
    }
    
    console.log('Debug - isUserAdmin:', isUserAdmin);
    setIsAdmin(isUserAdmin);
    
    if (isUserAdmin) {
      setActiveTab('admin');
    } else {
      const userFamily = localStorage.getItem('userFamily');
      if (userFamily) {
        setCurrentFamily(userFamily);
      }
    }
    
    // Testar conexão e carregar dados
    initializeApp();
  }, []);

  const initializeApp = async () => {
    try {
      console.log('Inicializando aplicação...');
      
      // Testar conexão com Supabase
      const isConnected = await FamilyService.testConnection();
      setConnectionStatus(isConnected ? 'connected' : 'error');
      
      if (isConnected) {
        // Carregar dados se for admin
        if (localStorage.getItem('userType') === 'admin') {
          await loadFamilies();
          await loadStatistics();
        }
        
        // Verificar se há dados para migrar
        await checkForMigration();
      } else {
        console.error('Falha na conexão com Supabase');
      }
    } catch (error) {
      console.error('Erro na inicialização:', error);
      setConnectionStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const checkForMigration = async () => {
    const storedFamilies = localStorage.getItem('familiesData');
    if (storedFamilies && isAdmin) {
      const shouldMigrate = confirm(
        'Foram encontrados dados no armazenamento local. Deseja migrar estes dados para o Supabase? Esta ação irá transferir todas as famílias e membros para o banco de dados.'
      );
      
      if (shouldMigrate) {
        setMigrating(true);
        try {
          await FamilyService.migrateFromLocalStorage();
          alert('Migração concluída com sucesso! Os dados foram transferidos para o Supabase.');
          await loadFamilies();
          await loadStatistics();
        } catch (error) {
          console.error('Erro na migração:', error);
          alert('Erro na migração. Verifique o console para mais detalhes.');
        } finally {
          setMigrating(false);
        }
      }
    }
  };

  const loadFamilies = async () => {
    try {
      console.log('Carregando famílias...');
      const familiesData = await FamilyService.getFamilies();
      console.log('Famílias carregadas:', familiesData);
      setFamilies(familiesData);
    } catch (error) {
      console.error('Erro ao carregar famílias:', error);
      setFamilies([]);
    }
  };

  const loadStatistics = async () => {
    try {
      console.log('Carregando estatísticas...');
      const stats = await FamilyService.getStatistics();
      console.log('Estatísticas carregadas:', stats);
      setStatistics(stats);
    } catch (error) {
      console.error('Erro ao carregar estatísticas:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('user');
    localStorage.removeItem('userType');
    localStorage.removeItem('userFamily');
    localStorage.removeItem('userId');
    localStorage.removeItem('confirmed');
    navigate('/login');
  };

  const canAddPerson = () => {
    if (isAdmin) return true;
    
    // Verificar se o usuário tem um papel que permite adicionar filhos
    // const userRole = localStorage.getItem('userRole');
    
    // Qualquer membro da família pode potencialmente ter filhos
    // Não apenas pais/mães, mas também filhos adultos (como Marcelo e Murilo)
    return true; // Permitir que qualquer membro tente adicionar filhos
  };

  const handleFamilyCreated = async () => {
    console.log('Família criada, recarregando dados...');
    await loadFamilies();
    await loadStatistics();
  };

  const handleDeleteFamily = async (familyId: string, familyName: string) => {
    const memberCount = await FamilyService.getFamilyMemberCount(familyId);
    
    const confirmMessage = memberCount > 0 
      ? `Tem certeza que deseja excluir a família "${familyName}"?\n\nEsta ação irá excluir:\n• A família\n• ${memberCount} membro(s)\n• Todos os usuários associados\n\nEsta ação NÃO PODE ser desfeita!`
      : `Tem certeza que deseja excluir a família "${familyName}"?\n\nEsta ação não pode ser desfeita!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);
      await FamilyService.deleteFamily(familyId);
      
      // Se a família excluída era a atual, limpar seleção
      if (currentFamily === familyId) {
        setCurrentFamily('');
      }
      
      // Recarregar dados
      await loadFamilies();
      await loadStatistics();
      
      alert(`Família "${familyName}" excluída com sucesso!`);
    } catch (error) {
      console.error('Erro ao excluir família:', error);
      alert('Erro ao excluir família. Verifique o console para mais detalhes.');
    } finally {
      setLoading(false);
    }
  };

  if (loading || migrating) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600 text-sm sm:text-base">
            {migrating ? 'Migrando dados para o Supabase...' : 'Carregando...'}
          </p>
          {connectionStatus === 'testing' && (
            <p className="text-xs sm:text-sm text-gray-500 mt-2">Testando conexão com Supabase...</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-14 sm:h-16">
            <div className="flex items-center space-x-2 sm:space-x-3">
              <div className="w-8 h-8 sm:w-10 sm:h-10 bg-green-100 rounded-full flex items-center justify-center">
                <i className="ri-family-tree-line text-lg sm:text-xl text-green-600"></i>
              </div>
              <div>
                <h1 className="text-lg sm:text-xl font-bold text-gray-800">Árvore Genealógica</h1>
                <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                  {isAdmin && (
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                      Administrador
                    </span>
                  )}
                  <span className={`text-xs px-2 py-1 rounded-full ${
                    connectionStatus === 'connected' 
                      ? 'bg-green-100 text-green-800' 
                      : 'bg-red-100 text-red-800'
                  }`}>
                    {connectionStatus === 'connected' ? 'Conectado' : 'Erro'}
                  </span>
                  {currentFamily && (
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full hidden sm:inline">
                      {families.find(f => f.id === currentFamily)?.name || currentFamily}
                    </span>
                  )}
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-2 sm:space-x-4">
              {canAddPerson() && connectionStatus === 'connected' && (
                <button
                  onClick={() => setShowAddModal(true)}
                  className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap text-xs sm:text-sm"
                >
                  <i className="ri-add-line mr-1 sm:mr-2"></i>
                  <span className="hidden sm:inline">{isAdmin ? 'Nova Família/Pessoa' : 'Adicionar Filho'}</span>
                  <span className="sm:hidden">Adicionar</span>
                </button>
              )}
              <button
                onClick={handleLogout}
                className="text-gray-600 hover:text-gray-800 transition-colors p-1"
              >
                <i className="ri-logout-box-line text-lg sm:text-xl"></i>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Connection Error Alert */}
      {connectionStatus === 'error' && (
        <div className="bg-red-50 border-l-4 border-red-400 p-3 sm:p-4">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex">
              <div className="flex-shrink-0">
                <i className="ri-error-warning-line text-red-400 text-lg sm:text-xl"></i>
              </div>
              <div className="ml-3">
                <p className="text-xs sm:text-sm text-red-700">
                  <strong>Erro de Conexão:</strong> Não foi possível conectar ao Supabase. 
                  Verifique as configurações de rede e tentar novamente.
                </p>
                <button 
                  onClick={initializeApp}
                  className="mt-2 text-xs sm:text-sm text-red-600 hover:text-red-800 underline"
                >
                  Tentar novamente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="bg-white border-b overflow-x-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <nav className="flex space-x-4 sm:space-x-8 min-w-max">
            <button
              onClick={() => setActiveTab('tree')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === 'tree'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-family-tree-line mr-1 sm:mr-2"></i>
              <span className="hidden sm:inline">Árvore Genealógica</span>
              <span className="sm:hidden">Árvore</span>
            </button>
            
            <button
              onClick={() => setActiveTab('profile')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === 'profile'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-user-line mr-1 sm:mr-2"></i>
              <span className="hidden sm:inline">Meu Perfil</span>
              <span className="sm:hidden">Perfil</span>
            </button>
            
            <button
              onClick={() => setActiveTab('family')}
              className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                activeTab === 'family'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-group-line mr-1 sm:mr-2"></i>
              <span className="hidden sm:inline">{isAdmin ? 'Todas as Famílias' : 'Minha Família'}</span>
              <span className="sm:hidden">Família</span>
            </button>

            {isAdmin && (
              <button
                onClick={() => setActiveTab('admin')}
                className={`py-3 sm:py-4 px-1 border-b-2 font-medium text-xs sm:text-sm transition-colors whitespace-nowrap ${
                  activeTab === 'admin'
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <i className="ri-settings-line mr-1 sm:mr-2"></i>
                <span className="hidden sm:inline">Administração</span>
                <span className="sm:hidden">Admin</span>
              </button>
            )}
          </nav>
        </div>
      </div>

      {/* Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {!isAdmin && currentFamily && connectionStatus === 'connected' && (
          <BirthdayNotifications currentFamily={currentFamily} />
        )}

        {activeTab === 'tree' && <FamilyTree currentFamily={currentFamily} isAdmin={isAdmin} />}
        {activeTab === 'profile' && <PersonProfile />}
        {activeTab === 'family' && (
          <div className="space-y-4 sm:space-y-6">
            {isAdmin ? (
              <div className="bg-white rounded-lg shadow p-4 sm:p-6">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                  <h2 className="text-lg sm:text-xl font-bold text-gray-800">Gerenciar Famílias</h2>
                  <button 
                    onClick={loadFamilies}
                    className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
                  >
                    <i className="ri-refresh-line mr-1 sm:mr-2"></i>
                    Atualizar
                  </button>
                </div>
                
                {families.length > 0 ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
                    {families.map((family) => (
                      <div key={family.id} className="border border-gray-200 rounded-lg p-4 sm:p-6 hover:shadow-md transition-shadow">
                        <div className="flex items-center justify-between mb-3 sm:mb-4">
                          <h3 className="text-base sm:text-lg font-medium text-gray-800 truncate">{family.name}</h3>
                          <span className="bg-green-100 text-green-800 text-xs sm:text-sm px-2 py-1 rounded-full whitespace-nowrap">
                            {family.members || 0} membros
                          </span>
                        </div>
                        <div className="text-xs text-gray-500 mb-3 sm:mb-4">
                          <p>ID: {family.id}</p>
                          {family.created_at && (
                            <p>Criada: {new Date(family.created_at).toLocaleDateString('pt-BR')}</p>
                          )}
                        </div>
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2">
                          <button 
                            onClick={() => {
                              setCurrentFamily(family.id);
                              setActiveTab('tree');
                            }}
                            className="flex-1 bg-blue-600 text-white py-2 px-3 rounded-lg text-xs sm:text-sm hover-bg-blue-700 transition-colors whitespace-nowrap"
                          >
                            Visualizar
                          </button>
                          <button 
                            onClick={() => handleDeleteFamily(family.id, family.name)}
                            className="bg-red-600 text-white py-2 px-3 rounded-lg text-xs sm:text-sm hover:bg-red-700 transition-colors whitespace-nowrap"
                            title="Excluir família inteira"
                          >
                            <i className="ri-delete-bin-line"></i>
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8 sm:py-12">
                    <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
                      <i className="ri-group-line text-2xl sm:text-4xl text-gray-300"></i>
                    </div>
                    <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">Nenhuma família cadastrada</h3>
                    <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
                      Comece criando a primeira família do sistema. Use o botão "Nova Família/Pessoa" para adicionar a primeira pessoa e criar uma nova família.
                    </p>
                    {connectionStatus === 'connected' && (
                      <button
                        onClick={() => setShowAddModal(true)}
                        className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap text-sm sm:text-base"
                      >
                        <i className="ri-add-line mr-1 sm:mr-2"></i>
                        Criar Primeira Família
                      </button>
                    )}
                  </div>
                )}
              </div>
            ) : (
              <HierarchicalFamilyTree currentFamily={currentFamily} isAdmin={isAdmin} />
            )}
          </div>
        )}

        {activeTab === 'admin' && isAdmin && (
          <div className="space-y-4 sm:space-y-6">
            <div className="bg-white rounded-lg shadow p-4 sm:p-6">
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
                <h2 className="text-lg sm:text-xl font-bold text-gray-800">Painel Administrativo</h2>
                <button 
                  onClick={() => {
                    loadFamilies();
                    loadStatistics();
                  }}
                  className="bg-blue-600 text-white px-3 sm:px-4 py-2 rounded-lg text-xs sm:text-sm hover:bg-blue-700 transition-colors whitespace-nowrap"
                >
                  <i className="ri-refresh-line mr-1 sm:mr-2"></i>
                  Atualizar Dados
                </button>
              </div>
              
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-6 mb-6 sm:mb-8">
                <div className="bg-blue-50 rounded-lg p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-blue-600">Total de Famílias</p>
                      <p className="text-lg sm:text-2xl font-bold text-blue-900">{statistics.totalFamilies}</p>
                    </div>
                    <i className="ri-home-heart-line text-xl sm:text-3xl text-blue-400"></i>
                  </div>
                </div>
                
                <div className="bg-green-50 rounded-lg p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-green-600">Total de Membros</p>
                      <p className="text-lg sm:text-2xl font-bold text-green-900">{statistics.totalMembers}</p>
                    </div>
                    <i className="ri-group-line text-xl sm:text-3xl text-green-400"></i>
                  </div>
                </div>
                
                <div className="bg-purple-50 rounded-lg p-3 sm:p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs sm:text-sm font-medium text-purple-600">Banco de Dados</p>
                      <p className="text-sm sm:text-lg font-bold text-purple-900">Supabase</p>
                    </div>
                    <i className="ri-database-2-line text-xl sm:text-3xl text-purple-400"></i>
                  </div>
                </div>

                <div className={`rounded-lg p-3 sm:p-6 ${
                  connectionStatus === 'connected' ? 'bg-green-50' : 'bg-red-50'
                }`}>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className={`text-xs sm:text-sm font-medium ${
                        connectionStatus === 'connected' ? 'text-green-600' : 'text-red-600'
                      }`}>Status</p>
                      <p className={`text-sm sm:text-lg font-bold ${
                        connectionStatus === 'connected' ? 'text-green-900' : 'text-red-900'
                      }`}>
                        {connectionStatus === 'connected' ? 'Online' : 'Offline'}
                      </p>
                    </div>
                    <i className={`text-xl sm:text-3xl ${
                      connectionStatus === 'connected' 
                        ? 'ri-shield-check-line text-green-400' 
                        : 'ri-error-warning-line text-red-400'
                    }`}></i>
                  </div>
                </div>
              </div>

              <div className="border-t pt-4 sm:pt-6">
                <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-3 sm:mb-4">Ações Administrativas</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                  <button 
                    onClick={() => setShowAddModal(true)}
                    disabled={connectionStatus !== 'connected'}
                    className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="ri-add-circle-line text-lg sm:text-xl text-green-600 mr-2 sm:mr-3"></i>
                    <div className="text-left">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">Criar Nova Família</p>
                      <p className="text-xs sm:text-sm text-gray-600">Adicionar primeira pessoa de uma família</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={() => setShowUserModal(true)}
                    disabled={connectionStatus !== 'connected'}
                    className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <i className="ri-user-settings-line text-lg sm:text-xl text-blue-600 mr-2 sm:mr-3"></i>
                    <div className="text-left">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">Gerenciar Usuários</p>
                      <p className="text-xs sm:text-sm text-gray-600">Controlar acessos e permissões</p>
                    </div>
                  </button>
                  
                  <button 
                    onClick={initializeApp}
                    className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                  >
                    <i className="ri-refresh-line text-lg sm:text-xl text-purple-600 mr-2 sm:mr-3"></i>
                    <div className="text-left">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">Testar Conexão</p>
                      <p className="text-xs sm:text-sm text-gray-600">Verificar status do Supabase</p>
                    </div>
                  </button>
                  
                  <button className="flex items-center p-3 sm:p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors">
                    <i className="ri-database-line text-lg sm:text-xl text-orange-600 mr-2 sm:mr-3"></i>
                    <div className="text-left">
                      <p className="font-medium text-gray-800 text-sm sm:text-base">Backup</p>
                      <p className="text-xs sm:text-sm text-gray-600">Backup e restauração de dados</p>
                    </div>
                    </button>
                </div>
              </div>

            </div>
          </div>
        )}
      </main>

      {showAddModal && connectionStatus === 'connected' && (
        <AddPersonModal 
          onClose={() => setShowAddModal(false)} 
          isAdmin={isAdmin}
          currentFamily={currentFamily}
          families={families}
          onFamilyCreated={handleFamilyCreated}
        />
      )}
      {showUserModal && connectionStatus === 'connected' && (
        <UserManagementModal 
          onClose={() => setShowUserModal(false)} 
          families={families}
        />
      )}
    </div>
  );
}
