
import { useState, useEffect, useRef, useCallback } from 'react';
import { FamilyService } from '../../../services/familyService';
import AddPersonModal from './AddPersonModal';
import PersonProfile from './PersonProfile';

interface FamilyTreeProps {
  currentFamily: string;
  isAdmin: boolean;
}

export default function FamilyTree({ currentFamily, isAdmin }: FamilyTreeProps) {
  const [viewMode, setViewMode] = useState<'tree' | 'list'>('tree');
  const [displayedMembers, setDisplayedMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [familyData, setFamilyData] = useState<any>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [selectedMemberForEdit, setSelectedMemberForEdit] = useState<any>(null);
  const [userMemberId, setUserMemberId] = useState<string | null>(null);
  const [canAddChildren, setCanAddChildren] = useState(false);
  const [canEditMembers, setCanEditMembers] = useState(false);
  const [userChildren, setUserChildren] = useState<string[]>([]);

  // Estados para funcionalidades administrativas
  const [showAdminModal, setShowAdminModal] = useState(false);
  const [selectedMemberForAdmin, setSelectedMemberForAdmin] = useState<any>(null);
  const [adminAction, setAdminAction] = useState<'edit_parent' | 'delete' | null>(null);
  const [potentialParents, setPotentialParents] = useState<any[]>([]);
  const [newParentId, setNewParentId] = useState<string>('');
  const [memberDescendants, setMemberDescendants] = useState<any[]>([]);

  const observer = useRef<IntersectionObserver>();
  const ITEMS_PER_PAGE = 6;

  // Verificar se o usuário pode adicionar filhos e editar membros
  const checkUserPermissions = useCallback(async () => {
    try {
      const userId = localStorage.getItem('userId');
      const userType = localStorage.getItem('userType');

      if (userType === 'admin') {
        setCanAddChildren(true);
        setCanEditMembers(true);
        return;
      }

      if (userId) {
        const userData = await FamilyService.getUserById(userId);
        if (userData && userData.member_id) {
          setUserMemberId(userData.member_id);

          // Buscar dados do membro para verificar se pode ter filhos
          const member = await FamilyService.getMemberById(userData.member_id);
          if (member) {
            // ATUALIZADO: Verificar se o papel permite ter filhos - incluindo irmãos
            const parentRoles = ['Pai', 'Mãe', 'Patriarca', 'Matriarca', 'Filho', 'Filha'];
            const isParent = parentRoles.includes(member.role || '');
            setCanAddChildren(isParent);
            setCanEditMembers(isParent);

            console.log('👤 Verificando permissões para:', {
              nome: `${member.first_name} ${member.last_name}`,
              papel: member.role,
              podeAdicionarFilhos: isParent
            });

            // Se pode ter filhos, buscar seus filhos para permitir edição
            if (isParent && currentFamily) {
              const familyMembers = await FamilyService.getFamilyMembers(currentFamily);
              const children = familyMembers.filter(m => m.parent_id === member.id);
              setUserChildren(children.map(c => c.id));
              console.log('👶 Filhos do usuário:', children.map(c => `${c.first_name} ${c.last_name}`));
            }
          }
        }
      }
    } catch (error) {
      console.error('Erro ao verificar permissões:', error);
      setCanAddChildren(false);
      setCanEditMembers(false);
    }
  }, [currentFamily]);

  // Carregar dados da família do Supabase
  const loadFamilyData = useCallback(async () => {
    if (!currentFamily) {
      setFamilyData(null);
      return;
    }

    try {
      setLoading(true);

      // Buscar dados da família
      const family = await FamilyService.getFamilyById(currentFamily);
      if (!family) {
        setFamilyData(null);
        return;
      }

      // Buscar membros da família
      const members = await FamilyService.getFamilyMembers(currentFamily);

      setFamilyData({
        name: family.name,
        members: members || []
      });
    } catch (error) {
      console.error('Erro ao carregar dados da família:', error);
      setFamilyData(null);
    } finally {
      setLoading(false);
    }
  }, [currentFamily]);

  // Função para carregar mais membros
  const loadMoreMembers = useCallback(() => {
    if (!familyData || loading || !hasMore) return;

    setLoading(true);

    setTimeout(() => {
      const startIndex = (page - 1) * ITEMS_PER_PAGE;
      const endIndex = startIndex + ITEMS_PER_PAGE;
      const newMembers = familyData.members.slice(startIndex, endIndex);

      if (newMembers.length === 0) {
        setHasMore(false);
      } else {
        setDisplayedMembers(prev => [...prev, ...newMembers]);
        setPage(prev => prev + 1);

        if (endIndex >= familyData.members.length) {
          setHasMore(false);
        }
      }

      setLoading(false);
    }, 500);
  }, [familyData, loading, hasMore, page]);

  // Ref callback para o último elemento
  const lastMemberElementRef = useCallback((node: HTMLDivElement) => {
    if (loading) return;
    if (observer.current) observer.current.disconnect();
    observer.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore) {
        loadMoreMembers();
      }
    });
    if (node) observer.current.observe(node);
  }, [loading, hasMore, loadMoreMembers]);

  // Carregar dados quando mudar de família
  useEffect(() => {
    loadFamilyData();
    checkUserPermissions();
  }, [loadFamilyData, checkUserPermissions]);

  // Reset quando mudar de família
  useEffect(() => {
    setDisplayedMembers([]);
    setPage(1);
    setHasMore(true);
    if (familyData && familyData.members.length > 0) {
      const initialMembers = familyData.members.slice(0, ITEMS_PER_PAGE);
      setDisplayedMembers(initialMembers);
      setPage(2);
      setHasMore(familyData.members.length > ITEMS_PER_PAGE);
    }
  }, [familyData]);

  const handleFamilyCreated = async () => {
    console.log('Membro adicionado, recarregando dados...');
    await loadFamilyData();
    await checkUserPermissions(); // Recarregar permissões após adicionar membro
  };

  // Verificar se o usuário pode editar um membro específico
  const canEditMember = (member: any) => {
    if (isAdmin) return true; // Admin pode editar qualquer um
    if (!canEditMembers) return false; // Se não tem permissão geral, não pode editar

    // Pai/Mãe pode editar apenas seus filhos
    return userChildren.includes(member.id);
  };

  // Formatar datas sem alteração de fuso horário
  const formatDateCorrectly = (dateString: string) => {
    if (!dateString) return '';
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR');
  };

  // Abrir modal de edição do perfil
  const handleEditMember = (member: any) => {
    if (canEditMember(member)) {
      setSelectedMemberForEdit(member);
      setShowProfileModal(true);
    }
  };

  // Buscar informações do pai/mãe de um membro
  const getParentInfo = (member: any) => {
    if (!member.parent_id || !familyData) return null;
    return familyData.members.find((m: any) => m.id === member.parent_id);
  };

  // NOVAS FUNÇÕES ADMINISTRATIVAS

  // Abrir modal administrativo
  const handleAdminAction = async (member: any, action: 'edit_parent' | 'delete') => {
    setSelectedMemberForAdmin(member);
    setAdminAction(action);

    if (action === 'edit_parent') {
      // Carregar potenciais pais
      const parents = await FamilyService.getPotentialParents(currentFamily, member.id);
      setPotentialParents(parents);
      setNewParentId(member.parent_id || '');
    } else if (action === 'delete') {
      // Carregar descendentes para mostrar o que será excluído
      const descendants = await FamilyService.getMemberDescendants(member.id);
      setMemberDescendants(descendants);
    }

    setShowAdminModal(true);
  };

  // Alterar parentesco
  const handleChangeParent = async () => {
    if (!selectedMemberForAdmin) return;

    try {
      setLoading(true);

      const parentIdToSet = newParentId === '' ? null : newParentId;
      await FamilyService.changeMemberParent(selectedMemberForAdmin.id, parentIdToSet);

      // Mostrar mensagem de sucesso
      const successMessage = document.createElement('div');
      successMessage.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50';
      successMessage.innerHTML = `
        <div class="flex items-center space-x-3">
          <i class="ri-check-circle-line text-green-600 text-xl"></i>
          <div>
            <p class="font-medium text-green-800">Parentesco Alterado!</p>
            <p class="text-sm text-green-700">A hierarquia familiar foi atualizada com sucesso.</p>
          </div>
        </div>
      `;

      document.body.appendChild(successMessage);
      setTimeout(() => {
        if (document.body.contains(successMessage)) {
          document.body.removeChild(successMessage);
        }
      }, 3000);

      // Recarregar dados
      await handleFamilyCreated();
      setShowAdminModal(false);
    } catch (error) {
      console.error('Erro ao alterar parentesco:', error);
      alert(`Erro ao alterar parentesco: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  // Excluir membro e descendentes
  const handleDeleteMember = async () => {
    if (!selectedMemberForAdmin) return;

    const totalToDelete = 1 + memberDescendants.length;
    const confirmMessage =
      totalToDelete === 1
        ? `Tem certeza que deseja excluir ${selectedMemberForAdmin.first_name} ${selectedMemberForAdmin.last_name}?\n\nEsta ação não pode ser desfeita!`
        : `Tem certeza que deseja excluir ${selectedMemberForAdmin.first_name} ${selectedMemberForAdmin.last_name} e todos os seus ${memberDescendants.length} descendentes?\n\nSerão excluídos:\n• ${selectedMemberForAdmin.first_name} ${selectedMemberForAdmin.last_name}\n${memberDescendants
            .map(d => `• ${d.first_name} ${d.last_name}`)
            .join('\n')}\n\nEsta ação NÃO PODE ser desfeita!`;

    if (!confirm(confirmMessage)) {
      return;
    }

    try {
      setLoading(true);

      if (memberDescendants.length > 0) {
        // Excluir em cascata
        const result = await FamilyService.deleteMemberAndDescendants(selectedMemberForAdmin.id);

        // Mostrar mensagem de sucesso
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50';
        successMessage.innerHTML = `
          <div class="flex items-center space-x-3">
            <i class="ri-check-circle-line text-green-600 text-xl"></i>
            <div>
              <p class="font-medium text-green-800">Exclusão Concluída!</p>
              <p class="text-sm text-green-700">${result.deletedCount} membros foram excluídos da família.</p>
            </div>
          </div>
        `;

        document.body.appendChild(successMessage);
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 4000);
      } else {
        // Excluir apenas o membro
        await FamilyService.deleteFamilyMember(selectedMemberForAdmin.id);

        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50';
        successMessage.innerHTML = `
          <div class="flex items-center space-x-3">
            <i class="ri-check-circle-line text-green-600 text-xl"></i>
            <div>
              <p class="font-medium text-green-800">Membro Excluído!</p>
              <p class="text-sm text-green-700">${selectedMemberForAdmin.first_name} ${selectedMemberForAdmin.last_name} foi removido da família.</p>
            </div>
          </div>
        `;

        document.body.appendChild(successMessage);
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
      }

      // Recarregar dados
      await handleFamilyCreated();
      setShowAdminModal(false);
    } catch (error) {
      console.error('Erro ao excluir membro:', error);
      alert(`Erro ao excluir membro: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow p-4 sm:p-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-4 sm:mb-6 space-y-3 sm:space-y-0">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-gray-800">
            {familyData?.name || 'Árvore Genealógica'}
          </h2>
          {isAdmin && (
            <span className="text-xs sm:text-sm text-blue-600">Visualizando como administrador</span>
          )}
        </div>

        <div className="flex flex-col sm:flex-row items-stretch sm:items-center space-y-2 sm:space-y-0 sm:space-x-3">
          {/* Botão para adicionar filho - apenas para usuários com permissão */}
          {canAddChildren && currentFamily && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap text-xs sm:text-sm"
            >
              <i className="ri-user-add-line mr-1 sm:mr-2"></i>
              {isAdmin ? 'Adicionar Pessoa' : 'Adicionar Filho'}
            </button>
          )}

          <div className="flex space-x-2">
            <button
              onClick={() => setViewMode('tree')}
              className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap ${
                viewMode === 'tree'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="ri-family-tree-line mr-1"></i>
              <span className="hidden sm:inline">Árvore</span>
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`px-2 sm:px-3 py-2 rounded-lg text-xs sm:text-sm transition-colors whitespace-nowrap ${
                viewMode === 'list'
                  ? 'bg-green-100 text-green-700'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              <i className="ri-list-unordered mr-1"></i>
              <span className="hidden sm:inline">Lista</span>
            </button>
          </div>
        </div>
      </div>

      {/* Informação sobre permissões para usuários não-admin */}
      {!isAdmin && !canAddChildren && currentFamily && (
        <div className="mb-4 sm:mb-6 bg-blue-50 border border-blue-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start space-x-3">
            <i className="ri-information-line text-blue-600 text-lg flex-shrink-0 mt-0.5"></i>
            <div>
              <h4 className="font-medium text-blue-800 mb-1 text-sm sm:text-base">Permissões de Cadastro</h4>
              <p className="text-xs sm:text-sm text-blue-700">
                Membros da família podem adicionar seus próprios filhos. Pais, mães, patriarcas, matriarcas e filhos adultos podem cadastrar a próxima geração.
                {userMemberId && ' Seu papel atual não permite adicionar novos membros.'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Informação sobre permissões de edição */}
      {!isAdmin && canEditMembers && userChildren.length > 0 && (
        <div className="mb-4 sm:mb-6 bg-green-50 border border-green-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start space-x-3">
            <i className="ri-edit-line text-green-600 text-lg flex-shrink-0 mt-0.5"></i>
            <div>
              <h4 className="font-medium text-green-800 mb-1 text-sm sm:text-base">Permissões de Edição</h4>
              <p className="text-xs sm:text-sm text-green-700">
                Você pode editar todos os dados dos seus {userChildren.length} filhos. Clique no botão "Editar" ao lado do nome de cada filho para gerenciar suas informações.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Informação sobre hierarquia familiar */}
      {!isAdmin && canAddChildren && currentFamily && (
        <div className="mb-4 sm:mb-6 bg-purple-50 border border-purple-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start space-x-3">
            <i className="ri-family-tree-line text-purple-600 text-lg flex-shrink-0 mt-0.5"></i>
            <div>
              <h4 className="font-medium text-purple-800 mb-1 text-sm sm:text-base">Hierarquia Familiar</h4>
              <p className="text-xs sm:text-sm text-purple-700">
                Como membro da família, você pode cadastrar seus filhos e continuar expandindo a árvore genealógica. Cada filho cadastrado poderá, no futuro, adicionar seus próprios filhos, garantindo a continuidade familiar.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Informação sobre poderes administrativos */}
      {isAdmin && currentFamily && (
        <div className="mb-4 sm:mb-6 bg-red-50 border border-red-200 rounded-lg p-3 sm:p-4">
          <div className="flex items-start space-x-3">
            <i className="ri-shield-user-line text-red-600 text-lg flex-shrink-0 mt-0.5"></i>
            <div>
              <h4 className="font-medium text-red-800 mb-1 text-sm sm:text-base">Poderes Administrativos</h4>
              <p className="text-xs sm:text-sm text-red-700">
                Como administrador, você pode alterar o parentesco de qualquer membro e excluir membros (incluindo todos os seus descendentes). Use os botões de ação ao lado de cada membro para gerenciar a hierarquia familiar.
              </p>
            </div>
          </div>
        </div>
      )}

      {familyData && familyData.members.length > 0 ? (
        <div className="space-y-4 sm:space-y-6">
          {viewMode === 'tree' ? (
            <div className="overflow-x-auto">
              <div className="min-w-full">
                {displayedMembers.map((member, index) => {
                  const isLast = index === displayedMembers.length - 1;
                  const isCurrentUser = userMemberId === member.id;
                  const canEdit = canEditMember(member);
                  const parentInfo = getParentInfo(member);

                  return (
                    <div
                      key={member.id}
                      className="mb-4 sm:mb-6"
                      ref={isLast ? lastMemberElementRef : null}
                    >
                      <div
                        className={`flex items-center space-x-3 sm:space-x-4 p-3 sm:p-4 border rounded-lg hover:bg-gray-50 transition-colors ${
                          isCurrentUser ? 'border-green-300 bg-green-50' : 'border-gray-200'
                        }`}
                      >
                        <div className="relative group">
                          <div
                            className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden transition-all duration-300 group-hover:shadow-lg ${
                              member.gender === 'masculino'
                                ? 'group-hover:ring-4 group-hover:ring-blue-300'
                                : member.gender === 'feminino'
                                ? 'group-hover:ring-4 group-hover:ring-pink-300'
                                : 'group-hover:ring-4 group-hover:ring-gray-300'
                            }`}
                          >
                            {member.photo_url ? (
                              <img
                                src={member.photo_url}
                                alt={`${member.first_name} ${member.last_name}`}
                                className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                              />
                            ) : (
                              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                                <i className="ri-user-line text-lg sm:text-xl text-gray-500"></i>
                              </div>
                            )}
                          </div>
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                            <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                              {member.first_name} {member.last_name}
                            </h3>
                            {isCurrentUser && (
                              <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                Você
                              </span>
                            )}
                            {canEdit && !isCurrentUser && (
                              <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium whitespace-nowrap">
                                Seu {member.role?.toLowerCase()}
                              </span>
                            )}
                          </div>
                          {parentInfo && (
                            <p className="text-xs text-gray-500 mt-1 truncate">
                              {member.role?.toLowerCase()} de {parentInfo.first_name} {parentInfo.last_name}
                            </p>
                          )}
                          {member.birth_date && (
                            <p className="text-xs text-gray-500 mt-1">{formatDateCorrectly(member.birth_date)}</p>
                          )}
                        </div>

                        <div className="flex flex-col sm:flex-row items-end sm:items-center space-y-1 sm:space-y-0 sm:space-x-2">
                          <div className="flex flex-wrap gap-1">
                            {member.email && (
                              <span className="bg-blue-50 text-blue-700 text-xs px-2 py-1 rounded-full font-medium">
                                <i className="ri-mail-line mr-1"></i>
                                <span className="hidden sm:inline">Email</span>
                              </span>
                            )}
                            {member.phone && (
                              <span className="bg-green-50 text-green-700 text-xs px-2 py-1 rounded-full font-medium">
                                <i className="ri-phone-line mr-1"></i>
                                <span className="hidden sm:inline">Telefone</span>
                              </span>
                            )}
                          </div>

                          {/* Botões administrativos */}
                          {isAdmin && (
                            <div className="flex space-x-1">
                              <button
                                onClick={() => handleAdminAction(member, 'edit_parent')}
                                className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                                title="Alterar parentesco"
                              >
                                <i className="ri-family-tree-line"></i>
                              </button>
                              <button
                                onClick={() => handleAdminAction(member, 'delete')}
                                className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                                title="Excluir membro"
                              >
                                <i className="ri-delete-bin-line"></i>
                              </button>
                            </div>
                          )}

                          {/* Botão de editar para pais/mães editarem filhos */}
                          {canEdit && (
                            <button
                              onClick={() => handleEditMember(member)}
                              className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition-colors whitespace-nowrap font-medium"
                              title={`Editar dados de ${member.first_name}`}
                            >
                              <i className="ri-edit-line mr-1"></i>
                              <span className="hidden sm:inline">Editar</span>
                            </button>
                          )}

                          <button className="text-gray-400 hover:text-gray-600 transition-colors p-1">
                            <i className="ri-more-line text-lg sm:text-xl"></i>
                          </button>
                        </div>
                      </div>
                    </div>
                  );
                })}

                {loading && (
                  <div className="flex justify-center py-6 sm:py-8">
                    <div className="flex items-center space-x-2 text-gray-600">
                      <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-green-600"></div>
                      <span className="text-xs sm:text-sm">Carregando mais membros...</span>
                    </div>
                  </div>
                )}

                {!hasMore && displayedMembers.length > 0 && (
                  <div className="text-center py-4 sm:py-6">
                    <p className="text-gray-500 text-xs sm:text-sm">
                      Todos os {familyData.members.length} membros foram carregados
                    </p>
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
              {displayedMembers.map((member, index) => {
                const isLast = index === displayedMembers.length - 1;
                const isCurrentUser = userMemberId === member.id;
                const canEdit = canEditMember(member);
                const parentInfo = getParentInfo(member);

                return (
                  <div
                    key={member.id}
                    className={`border rounded-xl p-3 sm:p-4 hover:shadow-lg transition-all duration-300 ${
                      isCurrentUser ? 'border-green-300 bg-green-50' : 'border-gray-200 hover:border-gray-300'
                    }`}
                    ref={isLast ? lastMemberElementRef : null}
                  >
                    <div className="flex items-center space-x-3 mb-3">
                      <div className="relative group">
                        <div
                          className={`w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden transition-all duration-300 group-hover:shadow-lg ${
                            member.gender === 'masculino'
                              ? 'group-hover:ring-4 group-hover:ring-blue-300'
                              : member.gender === 'feminino'
                              ? 'group-hover:ring-4 group-hover:ring-pink-300'
                              : 'group-hover:ring-4 group-hover:ring-gray-300'
                          }`}
                        >
                          {member.photo_url ? (
                            <img
                              src={member.photo_url}
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-10 h-10 sm:w-12 sm:h-12 rounded-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                            />
                          ) : (
                            <div className="w-10 h-10 sm:w-12 sm:h-12 bg-gradient-to-br from-gray-100 to-gray-200 rounded-full flex items-center justify-center">
                              <i className="ri-user-line text-lg sm:text-xl text-gray-500"></i>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-1 sm:gap-2">
                          <h3 className="font-semibold text-gray-800 text-sm sm:text-base truncate">
                            {member.first_name} {member.last_name}
                          </h3>
                          {isCurrentUser && (
                            <span className="bg-green-100 text-green-800 text-xs px-2 py-1 rounded-full font-medium">
                              Você
                            </span>
                          )}
                        </div>
                        {parentInfo && (
                          <p className="text-xs text-gray-500 mt-1 truncate">
                            {member.role?.toLowerCase()} de {parentInfo.first_name} {parentInfo.last_name}
                          </p>
                        )}
                      </div>
                    </div>

                    <div className="space-y-2">
                      {member.email && (
                        <p className="text-xs text-gray-600 flex items-center truncate">
                          <i className="ri-mail-line mr-2 text-blue-500 flex-shrink-0"></i>
                          <span className="truncate">{member.email}</span>
                        </p>
                      )}
                      {member.phone && (
                        <p className="text-xs text-gray-600 flex items-center">
                          <i className="ri-phone-line mr-2 text-green-500 flex-shrink-0"></i>
                          {member.phone}
                        </p>
                      )}
                      {member.address && (
                        <p className="text-xs text-gray-600 flex items-center truncate">
                          <i className="ri-map-pin-line mr-2 text-purple-500 flex-shrink-0"></i>
                          <span className="truncate">{member.address}</span>
                        </p>
                      )}
                    </div>

                    <div className="flex justify-between items-center mt-3 sm:mt-4 pt-3 border-t border-gray-100">
                      <span className="text-xs text-gray-500 font-medium truncate">
                        {member.birth_date ? formatDateCorrectly(member.birth_date) : 'Data não informada'}
                      </span>

                      <div className="flex space-x-1">
                        {/* Botões administrativos */}
                        {isAdmin && (
                          <>
                            <button
                              onClick={() => handleAdminAction(member, 'edit_parent')}
                              className="bg-blue-600 text-white px-2 py-1 rounded text-xs hover:bg-blue-700 transition-colors"
                              title="Alterar parentesco"
                            >
                              <i className="ri-family-tree-line"></i>
                            </button>
                            <button
                              onClick={() => handleAdminAction(member, 'delete')}
                              className="bg-red-600 text-white px-2 py-1 rounded text-xs hover:bg-red-700 transition-colors"
                              title="Excluir membro"
                            >
                              <i className="ri-delete-bin-line"></i>
                            </button>
                          </>
                        )}

                        {canEdit ? (
                          <button
                            onClick={() => handleEditMember(member)}
                            className="bg-blue-600 text-white px-2 sm:px-3 py-1 rounded-lg text-xs hover:bg-blue-700 transition-colors whitespace-nowrap font-medium"
                          >
                            <i className="ri-edit-line mr-1"></i>
                            <span className="hidden sm:inline">Editar</span>
                          </button>
                        ) : (
                          !isAdmin && (
                            <button className="text-blue-600 hover:text-blue-700 text-xs font-medium transition-colors">
                              Ver detalhes
                            </button>
                          )
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {viewMode === 'list' && loading && (
            <div className="flex justify-center py-6 sm:py-8">
              <div className="flex items-center space-x-2 text-gray-600">
                <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-green-600"></div>
                <span className="text-xs sm:text-sm">Carregando mais membros...</span>
              </div>
            </div>
          )}

          {viewMode === 'list' && !hasMore && displayedMembers.length > 0 && (
            <div className="text-center py-4 sm:py-6">
              <p className="text-gray-5  00 text-xs sm:text-sm">
                Todos os {familyData.members.length} membros foram carregados
              </p>
            </div>
          )}

          <div className="bg-green-50 rounded-lg p-3 sm:p-4">
            <h4 className="font-medium text-green-800 mb-2 text-sm sm:text-base">Estatísticas da Família</h4>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-xs sm:text-sm">
              <div>
                <p className="text-green-600">Total de Membros</p>
                <p className="font-bold text-green-800 text-sm sm:text-base">{familyData.members.length}</p>
              </div>
              <div>
                <p className="text-green-600">Carregados</p>
                <p className="font-bold text-green-800 text-sm sm:text-base">{displayedMembers.length}</p>
              </div>
              <div>
                <p className="text-green-600">Com Email</p>
                <p className="font-bold text-green-800 text-sm sm:text-base">
                  {familyData.members.filter((m: any) => m.email).length}
                </p>
              </div>
              <div>
                <p className="text-green-600">Com Telefone</p>
                <p className="font-bold text-green-800 text-sm sm:text-base">
                  {familyData.members.filter((m: any) => m.phone).length}
                </p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-12 sm:py-16">
          <div className="w-16 h-16 sm:w-24 sm:h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 sm:mb-6">
            <i className="ri-family-tree-line text-2xl sm:text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-base sm:text-lg font-medium text-gray-800 mb-2">
            {familyData ? 'Família sem membros' : 'Família não encontrada'}
          </h3>
          <p className="text-sm sm:text-base text-gray-600 mb-4 sm:mb-6 max-w-md mx-auto">
            {familyData
              ? 'Esta família ainda não possui membros cadastrados.'
              : 'A família selecionada não foi encontrada no sistema.'}
          </p>
          {canAddChildren && currentFamily && (
            <button
              onClick={() => setShowAddModal(true)}
              className="bg-green-600 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium hover:bg-green-7  00 transition-colors"
            >
              Adicionar primeiro membro
            </button>
          )}
        </div>
      )}

      {/* Modal de Adição */}
      {showAddModal && (
        <AddPersonModal
          onClose={() => setShowAddModal(false)}
          onFamilyCreated={handleFamilyCreated}
          currentFamily={currentFamily}
          isAdmin={isAdmin}
          families={[]}
        />
      )}

      {/* Modal de Edição */}
      {showProfileModal && selectedMemberForEdit && (
        <PersonProfile
          member={selectedMemberForEdit}
          onClose={() => {
            setShowProfileModal(false);
            setSelectedMemberForEdit(null);
          }}
          onUpdate={handleFamilyCreated}
          isEditingChild={true}
        />
      )}
    </div>
  );
}
