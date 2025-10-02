
import { useState, useEffect } from 'react';
import { FamilyService } from '../../../services/familyService';

interface UserManagementModalProps {
  onClose: () => void;
  families: any[];
}

interface SystemUser {
  id: string;
  username: string;
  family_id?: string;
  member_id?: string;
  user_type: 'admin' | 'member';
  is_active: boolean;
  created_at: string;
  family_name?: string;
  member_name?: string;
}

export default function UserManagementModal({ onClose, families }: UserManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'users' | 'create'>('users');
  const [users, setUsers] = useState<SystemUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState<'all' | 'admin' | 'member'>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | 'active' | 'inactive'>('all');

  // Dados para criar novo usuário
  const [newUser, setNewUser] = useState({
    username: '',
    familyId: '',
    memberId: '',
    userType: 'member' as 'admin' | 'member',
    isActive: true
  });

  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [createLoading, setCreateLoading] = useState(false);

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    try {
      // Simular carregamento de usuários do sistema
      // Em um sistema real, isso viria do Supabase
      const mockUsers: SystemUser[] = [
        {
          id: '1',
          username: 'admin',
          user_type: 'admin',
          is_active: true,
          created_at: '2024-01-01T00:00:00Z',
          family_name: 'Sistema',
          member_name: 'Administrador'
        },
        {
          id: '2',
          username: 'joao.silva',
          family_id: families[0]?.id,
          member_id: 'member1',
          user_type: 'member',
          is_active: true,
          created_at: '2024-01-15T00:00:00Z',
          family_name: families[0]?.name,
          member_name: 'João Silva'
        },
        {
          id: '3',
          username: 'maria.santos',
          family_id: families[1]?.id,
          member_id: 'member2',
          user_type: 'member',
          is_active: false,
          created_at: '2024-02-01T00:00:00Z',
          family_name: families[1]?.name,
          member_name: 'Maria Santos'
        }
      ];
      
      setUsers(mockUsers);
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadFamilyMembers = async (familyId: string) => {
    if (!familyId) {
      setFamilyMembers([]);
      return;
    }

    try {
      const members = await FamilyService.getFamilyMembers(familyId);
      setFamilyMembers(members);
    } catch (error) {
      console.error('Erro ao carregar membros:', error);
      setFamilyMembers([]);
    }
  };

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newUser.username.trim()) return;

    setCreateLoading(true);
    try {
      const userData = {
        username: newUser.username,
        family_id: newUser.familyId || null,
        member_id: newUser.memberId || null,
        user_type: newUser.userType,
        is_active: newUser.isActive
      };

      const createdUser = await FamilyService.createSystemUser(userData);
      
      if (createdUser) {
        await loadUsers();
        setActiveTab('users');
        setNewUser({
          username: '',
          familyId: '',
          memberId: '',
          userType: 'member',
          isActive: true
        });
        setFamilyMembers([]);
      }
    } catch (error) {
      console.error('Erro ao criar usuário:', error);
      alert('Erro ao criar usuário. Verifique se o nome de usuário não está em uso.');
    } finally {
      setCreateLoading(false);
    }
  };

  const toggleUserStatus = async (userId: string, currentStatus: boolean) => {
    try {
      // Simular toggle de status
      setUsers(prev => prev.map(user => 
        user.id === userId 
          ? { ...user, is_active: !currentStatus }
          : user
      ));
    } catch (error) {
      console.error('Erro ao alterar status:', error);
    }
  };

  const deleteUser = async (userId: string) => {
    if (!confirm('Tem certeza que deseja excluir este usuário? Esta ação não pode ser desfeita.')) {
      return;
    }

    try {
      // Simular exclusão
      setUsers(prev => prev.filter(user => user.id !== userId));
    } catch (error) {
      console.error('Erro ao excluir usuário:', error);
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.member_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.family_name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || user.user_type === filterType;
    const matchesStatus = filterStatus === 'all' || 
                         (filterStatus === 'active' && user.is_active) ||
                         (filterStatus === 'inactive' && !user.is_active);

    return matchesSearch && matchesType && matchesStatus;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b">
          <h2 className="text-xl font-bold text-gray-800">Gerenciar Usuários</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <i className="ri-close-line text-2xl"></i>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b bg-gray-50">
          <div className="flex space-x-8 px-6">
            <button
              onClick={() => setActiveTab('users')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'users'
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-user-line mr-2"></i>
              Usuários ({users.length})
            </button>
            
            <button
              onClick={() => setActiveTab('create')}
              className={`py-4 px-1 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                activeTab === 'create'
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              <i className="ri-user-add-line mr-2"></i>
              Criar Usuário
            </button>
          </div>
        </div>

        <div className="overflow-y-auto" style={{ maxHeight: 'calc(90vh - 140px)' }}>
          {activeTab === 'users' ? (
            <div className="p-6">
              {/* Filtros */}
              <div className="mb-6 space-y-4">
                <div className="flex flex-wrap gap-4">
                  <div className="flex-1 min-w-64">
                    <div className="relative">
                      <i className="ri-search-line absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400"></i>
                      <input
                        type="text"
                        placeholder="Buscar por usuário, nome ou família..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      />
                    </div>
                  </div>
                  
                  <select
                    value={filterType}
                    onChange={(e) => setFilterType(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                  >
                    <option value="all">Todos os tipos</option>
                    <option value="admin">Administradores</option>
                    <option value="member">Membros</option>
                  </select>
                  
                  <select
                    value={filterStatus}
                    onChange={(e) => setFilterStatus(e.target.value as any)}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm pr-8"
                  >
                    <option value="all">Todos os status</option>
                    <option value="active">Ativos</option>
                    <option value="inactive">Inativos</option>
                  </select>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm text-gray-600">
                    {filteredUsers.length} usuário(s) encontrado(s)
                  </p>
                  <div className="flex items-center space-x-4 text-sm">
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                      <span className="text-gray-600">Ativo</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                      <span className="text-gray-600">Inativo</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Lista de usuários */}
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
                  <p className="text-gray-600">Carregando usuários...</p>
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="space-y-4">
                  {filteredUsers.map((user) => (
                    <div key={user.id} className="border border-gray-200 rounded-lg p-4 hover:bg-gray-50 transition-colors">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                          <div className="relative">
                            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center">
                              <i className={`ri-${user.user_type === 'admin' ? 'admin' : 'user'}-line text-xl text-gray-600`}></i>
                            </div>
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white ${
                              user.is_active ? 'bg-green-500' : 'bg-red-500'
                            }`}></div>
                          </div>
                          
                          <div>
                            <div className="flex items-center space-x-2">
                              <h3 className="font-medium text-gray-800">@{user.username}</h3>
                              <span className={`text-xs px-2 py-1 rounded-full ${
                                user.user_type === 'admin' 
                                  ? 'bg-purple-100 text-purple-800' 
                                  : 'bg-blue-100 text-blue-800'
                              }`}>
                                {user.user_type === 'admin' ? 'Administrador' : 'Membro'}
                              </span>
                            </div>
                            <p className="text-sm text-gray-600">{user.member_name || 'Nome não informado'}</p>
                            <p className="text-xs text-gray-500">
                              {user.family_name ? `Família: ${user.family_name}` : 'Sem família associada'}
                            </p>
                          </div>
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <div className="text-right text-xs text-gray-500">
                            <p>Criado em</p>
                            <p>{new Date(user.created_at).toLocaleDateString('pt-BR')}</p>
                          </div>
                          
                          <div className="flex space-x-1">
                            <button
                              onClick={() => toggleUserStatus(user.id, user.is_active)}
                              className={`p-2 rounded-lg transition-colors ${
                                user.is_active 
                                  ? 'text-orange-600 hover:bg-orange-50' 
                                  : 'text-green-600 hover:bg-green-50'
                              }`}
                              title={user.is_active ? 'Desativar usuário' : 'Ativar usuário'}
                            >
                              <i className={`ri-${user.is_active ? 'pause' : 'play'}-circle-line text-lg`}></i>
                            </button>
                            
                            <button
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Editar usuário"
                            >
                              <i className="ri-edit-line text-lg"></i>
                            </button>
                            
                            {user.user_type !== 'admin' && (
                              <button
                                onClick={() => deleteUser(user.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="Excluir usuário"
                              >
                                <i className="ri-delete-bin-line text-lg"></i>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
                    <i className="ri-user-search-line text-4xl text-gray-400"></i>
                  </div>
                  <h3 className="text-lg font-medium text-gray-800 mb-2">Nenhum usuário encontrado</h3>
                  <p className="text-gray-600 mb-6 max-w-md mx-auto">
                    {searchTerm || filterType !== 'all' || filterStatus !== 'all'
                      ? 'Tente ajustar os filtros de busca.'
                      : 'Ainda não há usuários cadastrados no sistema.'
                    }
                  </p>
                </div>
              )}
            </div>
          ) : (
            <form onSubmit={handleCreateUser} className="p-6 space-y-6">
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="ri-user-add-line text-2xl text-green-600"></i>
                </div>
                <h3 className="text-lg font-medium text-gray-800 mb-2">Criar Novo Usuário</h3>
                <p className="text-sm text-gray-600">
                  Adicione um novo usuário ao sistema e defina suas permissões.
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Nome de Usuário *
                  </label>
                  <input
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    placeholder="Ex: joao.silva"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">
                    Apenas letras, números, pontos e underscores.
                  </p>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Tipo de Usuário *
                  </label>
                  <select
                    value={newUser.userType}
                    onChange={(e) => setNewUser({ ...newUser, userType: e.target.value as 'admin' | 'member' })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                  >
                    <option value="member">Membro</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Família (opcional)
                  </label>
                  <select
                    value={newUser.familyId}
                    onChange={(e) => {
                      setNewUser({ ...newUser, familyId: e.target.value, memberId: '' });
                      loadFamilyMembers(e.target.value);
                    }}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                  >
                    <option value="">Selecione uma família</option>
                    {families.map((family) => (
                      <option key={family.id} value={family.id}>
                        {family.name}
                      </option>
                    ))}
                  </select>
                </div>

                {newUser.familyId && familyMembers.length > 0 && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Membro Associado (opcional)
                    </label>
                    <select
                      value={newUser.memberId}
                      onChange={(e) => setNewUser({ ...newUser, memberId: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent pr-8"
                    >
                      <option value="">Selecione um membro</option>
                      {familyMembers.map((member) => (
                        <option key={member.id} value={member.id}>
                          {member.first_name} {member.last_name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-3">
                <input
                  type="checkbox"
                  id="isActive"
                  checked={newUser.isActive}
                  onChange={(e) => setNewUser({ ...newUser, isActive: e.target.checked })}
                  className="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                />
                <label htmlFor="isActive" className="text-sm text-gray-700">
                  Usuário ativo (pode fazer login no sistema)
                </label>
              </div>

              <div className="bg-blue-50 rounded-lg p-4">
                <h4 className="font-medium text-blue-800 mb-2">Permissões por Tipo de Usuário</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-start space-x-2">
                    <i className="ri-admin-line text-purple-600 mt-0.5"></i>
                    <div>
                      <p className="font-medium text-purple-800">Administrador</p>
                      <p className="text-purple-700">Acesso total: gerenciar famílias, usuários e configurações</p>
                    </div>
                  </div>
                  <div className="flex items-start space-x-2">
                    <i className="ri-user-line text-blue-600 mt-0.5"></i>
                    <div>
                      <p className="font-medium text-blue-800">Membro</p>
                      <p className="text-blue-700">Acesso limitado: visualizar e editar apenas sua família</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex space-x-4 pt-6 border-t">
                <button
                  type="button"
                  onClick={() => setActiveTab('users')}
                  className="flex-1 bg-gray-100 text-gray-700 py-3 px-4 rounded-lg font-medium hover:bg-gray-200 transition-colors whitespace-nowrap"
                  disabled={createLoading}
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={createLoading || !newUser.username.trim()}
                  className="flex-1 bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed whitespace-nowrap"
                >
                  {createLoading ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Criando...
                    </>
                  ) : (
                    <>
                      <i className="ri-add-line mr-2"></i>
                      Criar Usuário
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
