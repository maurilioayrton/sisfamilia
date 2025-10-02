
import { useState, useEffect } from 'react';
import { FamilyService } from '../../../services/familyService';

interface PersonProfileProps {
  member?: any; // Membro específico para edição (quando pai/mãe edita filho)
  onClose?: () => void; // Função para fechar modal
  onUpdate?: () => void; // Função para atualizar dados após edição
  isEditingChild?: boolean; // Se está editando um filho
}

export default function PersonProfile({ member, onClose, onUpdate, isEditingChild = false }: PersonProfileProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [profile, setProfile] = useState({
    id: '',
    name: '',
    firstName: '',
    lastName: '',
    birthDate: '',
    photo: '',
    email: '',
    phone: '',
    address: '',
    role: '',
    gender: '',
    familyName: '',
    userType: ''
  });

  const [editForm, setEditForm] = useState(profile);

  // Carregar dados do perfil do usuário logado ou membro específico
  useEffect(() => {
    if (member) {
      // Se foi passado um membro específico, carregar seus dados
      loadMemberProfile(member);
    } else {
      // Senão, carregar perfil do usuário logado
      loadUserProfile();
    }
  }, [member]);

  const loadMemberProfile = async (memberData: any) => {
    try {
      setLoading(true);
      
      console.log('👤 Carregando perfil do membro:', memberData);
      
      // Buscar dados da família
      let familyName = '';
      if (memberData.family_id) {
        const family = await FamilyService.getFamilyById(memberData.family_id);
        familyName = family?.name || '';
      }

      const profileData = {
        id: memberData.id,
        name: `${memberData.first_name} ${memberData.last_name}`,
        firstName: memberData.first_name,
        lastName: memberData.last_name,
        birthDate: memberData.birth_date || '',
        photo: memberData.photo_url || '',
        email: memberData.email || '',
        phone: memberData.phone || '',
        address: memberData.address || '',
        role: memberData.role || 'Membro da família',
        gender: memberData.gender || '',
        familyName: familyName,
        userType: 'member'
      };

      console.log('✅ Perfil do membro montado:', profileData);
      setProfile(profileData);
      setEditForm(profileData);
    } catch (error) {
      console.error('❌ Erro ao carregar perfil do membro:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserProfile = async () => {
    try {
      setLoading(true);
      
      // Buscar dados do usuário logado
      const userId = localStorage.getItem('userId');
      const userType = localStorage.getItem('userType');
      
      console.log('🔍 Carregando perfil do usuário:', { userId, userType });
      
      if (!userId) {
        console.error('❌ ID do usuário não encontrado no localStorage');
        return;
      }

      // Buscar dados completos do usuário no Supabase
      const userData = await FamilyService.getUserById(userId);
      if (!userData) {
        console.error('❌ Usuário não encontrado no Supabase');
        return;
      }

      console.log('✅ Dados do usuário carregados:', userData);
      
      // Se o usuário tem member_id, buscar dados do membro
      if (userData.member_id) {
        console.log('👤 Usuário tem member_id, buscando dados do membro:', userData.member_id);
        
        const memberData = await FamilyService.getMemberById(userData.member_id);
        
        if (memberData) {
          console.log('✅ Dados do membro carregados:', memberData);
          
          // Buscar dados da família
          let familyName = '';
          if (memberData.family_id) {
            const family = await FamilyService.getFamilyById(memberData.family_id);
            familyName = family?.name || '';
          }

          const profileData = {
            id: memberData.id,
            name: `${memberData.first_name} ${memberData.last_name}`,
            firstName: memberData.first_name,
            lastName: memberData.last_name,
            birthDate: memberData.birth_date || '',
            photo: memberData.photo_url || '',
            email: memberData.email || '',
            phone: memberData.phone || '',
            address: memberData.address || '',
            role: memberData.role || 'Membro da família',
            gender: memberData.gender || '',
            familyName: familyName,
            userType: 'member'
          };

          console.log('✅ Perfil do membro montado:', profileData);
          setProfile(profileData);
          setEditForm(profileData);
        } else {
          console.error('❌ Membro não encontrado:', userData.member_id);
        }
      } else {
        console.log('👨‍💼 Usuário é administrador, montando perfil admin');
        
        // Se não tem member_id, é um usuário admin sem perfil de membro
        const profileData = {
          id: userData.id,
          name: userData.username || 'Administrador',
          firstName: userData.username || 'Admin',
          lastName: '',
          birthDate: '',
          photo: '',
          email: '',
          phone: '',
          address: '',
          role: 'Administrador do Sistema',
          gender: '',
          familyName: 'Sistema',
          userType: 'admin'
        };

        console.log('✅ Perfil do admin montado:', profileData);
        setProfile(profileData);
        setEditForm(profileData);
      }
    } catch (error) {
      console.error('❌ Erro ao carregar perfil:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    try {
      setSaving(true);
      
      console.log('💾 Iniciando salvamento do perfil...');
      
      // Verificar se é um membro da família (não admin)
      if (profile.userType === 'member' && profile.id) {
        console.log('👤 Salvando dados do membro:', profile.id);
        
        // Para edição de filhos, permitir edição de todos os campos
        // Para edição própria, restringir nome, sobrenome e data de nascimento
        const updateData: any = {
          email: editForm.email.trim() || null,
          phone: editForm.phone.trim() || null,
          address: editForm.address.trim() || null,
          gender: editForm.gender || null,
          photo_url: editForm.photo || null
        };

        // Se está editando um filho (pai/mãe editando), permitir edição completa
        if (isEditingChild) {
          updateData.first_name = editForm.firstName.trim();
          updateData.last_name = editForm.lastName.trim();
          updateData.birth_date = editForm.birthDate || null;
        }

        console.log('📝 Dados para atualização:', updateData);
        
        // Atualizar no Supabase
        const updatedMember = await FamilyService.updateFamilyMember(profile.id, updateData);
        
        if (updatedMember) {
          // Atualizar estado local com dados atualizados
          const updatedProfile = {
            ...editForm,
            name: `${updatedMember.first_name} ${updatedMember.last_name}`,
            firstName: updatedMember.first_name,
            lastName: updatedMember.last_name,
            birthDate: updatedMember.birth_date || '',
            email: updatedMember.email || '',
            phone: updatedMember.phone || '',
            address: updatedMember.address || '',
            gender: updatedMember.gender || '',
            photo: updatedMember.photo_url || ''
          };
          
          setProfile(updatedProfile);
          setEditForm(updatedProfile);
          setIsEditing(false);
          
          console.log('✅ Perfil atualizado com sucesso!');
          
          // Chamar callback de atualização se fornecido
          if (onUpdate) {
            onUpdate();
          }
          
          // Mostrar mensagem de sucesso no padrão do sistema
          const successMessage = document.createElement('div');
          successMessage.className = 'fixed top-4 right-4 bg-green-50 border border-green-200 rounded-lg p-4 shadow-lg z-50';
          successMessage.innerHTML = `
            <div class="flex items-center space-x-3">
              <i class="ri-check-circle-line text-green-600 text-xl"></i>
              <div>
                <p class="font-medium text-green-800">${isEditingChild ? 'Dados do Filho Atualizados!' : 'Perfil Atualizado!'}</p>
                <p class="text-sm text-green-700">${isEditingChild ? 'As informações foram salvas com sucesso.' : 'Suas informações foram salvas com sucesso.'}</p>
              </div>
            </div>
          `;
          
          document.body.appendChild(successMessage);
          
          // Remover mensagem após 3 segundos
          setTimeout(() => {
            if (document.body.contains(successMessage)) {
              document.body.removeChild(successMessage);
            }
          }, 3000);
        }
      } else if (profile.userType === 'admin') {
        console.log('👨‍💼 Usuário admin - salvamento limitado');
        
        // Para admins, apenas atualizar estado local (sem persistência no banco)
        const updatedProfile = {
          ...editForm,
          name: editForm.firstName
        };
        
        setProfile(updatedProfile);
        setIsEditing(false);
        
        // Mostrar mensagem de sucesso no padrão do sistema
        const successMessage = document.createElement('div');
        successMessage.className = 'fixed top-4 right-4 bg-blue-50 border border-blue-200 rounded-lg p-4 shadow-lg z-50';
        successMessage.innerHTML = `
          <div class="flex items-center space-x-3">
            <i class="ri-information-line text-blue-600 text-xl"></i>
            <div>
              <p class="font-medium text-blue-800">Informações Atualizadas!</p>
              <p class="text-sm text-blue-700">Alterações salvas localmente.</p>
            </div>
          </div>
        `;
        
        document.body.appendChild(successMessage);
        
        // Remover mensagem após 3 segundos
        setTimeout(() => {
          if (document.body.contains(successMessage)) {
            document.body.removeChild(successMessage);
          }
        }, 3000);
      } else {
        console.error('❌ Tipo de usuário não identificado ou ID inválido');
        
        // Mostrar mensagem de erro no padrão do sistema
        const errorMessage = document.createElement('div');
        errorMessage.className = 'fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50';
        errorMessage.innerHTML = `
          <div class="flex items-center space-x-3">
            <i class="ri-error-warning-line text-red-600 text-xl"></i>
            <div>
              <p class="font-medium text-red-800">Erro de Identificação</p>
              <p class="text-sm text-red-700">Não foi possível identificar o tipo de usuário.</p>
            </div>
          </div>
        `;
        
        document.body.appendChild(errorMessage);
        
        // Remover mensagem após 4 segundos
        setTimeout(() => {
          if (document.body.contains(errorMessage)) {
            document.body.removeChild(errorMessage);
          }
        }, 4000);
      }
    } catch (error) {
      console.error('❌ Erro ao salvar perfil:', error);
      
      // Mostrar mensagem de erro no padrão do sistema
      const errorMessage = document.createElement('div');
      errorMessage.className = 'fixed top-4 right-4 bg-red-50 border border-red-200 rounded-lg p-4 shadow-lg z-50';
      errorMessage.innerHTML = `
        <div class="flex items-center space-x-3">
          <i class="ri-error-warning-line text-red-600 text-xl"></i>
          <div>
            <p class="font-medium text-red-800">Erro ao Salvar</p>
            <p class="text-sm text-red-700">Verifique sua conexão e tente novamente.</p>
          </div>
        </div>
      `;
      
      document.body.appendChild(errorMessage);
      
      // Remover mensagem após 4 segundos
      setTimeout(() => {
        if (document.body.contains(errorMessage)) {
          document.body.removeChild(errorMessage);
        }
      }, 4000);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditForm(profile);
    setIsEditing(false);
  };

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const maxSize = 5 * 1024 * 1024; // 5MB
      if (file.size > maxSize) {
        alert('A imagem deve ter no máximo 5MB');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setEditForm({ ...editForm, photo: result });
      };
      reader.readAsDataURL(file);
    }
  };

  const calculateAge = (birthDate: string) => {
    if (!birthDate) return null;
    
    const today = new Date();
    // Criar data sem conversão de fuso horário para evitar problema de um dia a menos
    const [year, month, day] = birthDate.split('-');
    const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age;
  };

  const formatDateCorrectly = (dateString: string) => {
    if (!dateString) return '';
    // Criar data sem conversão de fuso horário
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR');
  };

  const getDefaultPhoto = () => {
    return 'https://readdy.ai/api/search-image?query=professional%20headshot%20portrait%2C%20friendly%20smile%2C%20modern%20lighting%2C%20simple%20background%2C%20family%20member%20photo%2C%20neutral%20expression&width=150&height=150&seq=profile&orientation=squarish';
  };

  if (loading) {
    return (
      <div className={isEditingChild ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" : "bg-white rounded-lg shadow"}>
        <div className={isEditingChild ? "bg-white rounded-lg shadow-xl w-full max-w-2xl" : ""}>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
              <p className="text-gray-600">Carregando perfil...</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Se não conseguiu carregar dados do perfil
  if (!profile.id && !profile.name) {
    return (
      <div className={isEditingChild ? "fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50" : "bg-white rounded-lg shadow"}>
        <div className={isEditingChild ? "bg-white rounded-lg shadow-xl w-full max-w-2xl" : ""}>
          <div className="p-6">
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <i className="ri-error-warning-line text-2xl text-red-600"></i>
              </div>
              <h3 className="text-lg font-medium text-gray-800 mb-2">Erro ao Carregar Perfil</h3>
              <p className="text-gray-600 mb-4">
                Não foi possível carregar os dados do perfil.
              </p>
              <button
                onClick={member ? () => loadMemberProfile(member) : loadUserProfile}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-refresh-line mr-2"></i>
                Tentar Novamente
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  const ProfileContent = () => (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-bold text-gray-800">
            {isEditingChild ? `Editar Dados - ${profile.name}` : 'Meu Perfil'}
          </h2>
          <div className="flex items-center space-x-2">
            {profile.userType === 'member' && !isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-blue-700 transition-colors whitespace-nowrap"
              >
                <i className="ri-edit-line mr-2"></i>
                Editar
              </button>
            ) : isEditing ? (
              <div className="flex space-x-2">
                <button
                  onClick={handleCancel}
                  disabled={saving}
                  className="bg-gray-100 text-gray-700 px-4 py-2 rounded-lg font-medium hover:bg-gray-200 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-green-600 text-white px-4 py-2 rounded-lg font-medium hover:bg-green-700 transition-colors whitespace-nowrap disabled:opacity-50"
                >
                  {saving ? (
                    <>
                      <i className="ri-loader-4-line animate-spin mr-2"></i>
                      Salvando...
                    </>
                  ) : (
                    'Salvar'
                  )}
                </button>
              </div>
            ) : profile.userType === 'admin' ? (
              <div className="bg-blue-50 text-blue-700 px-3 py-1 rounded-lg text-sm">
                <i className="ri-shield-user-line mr-1"></i>
                Perfil Administrativo
              </div>
            ) : null}
            
            {isEditingChild && onClose && (
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <i className="ri-close-line text-2xl"></i>
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="p-6">
        <div className="flex flex-col lg:flex-row lg:space-x-8">
          {/* Photo Section */}
          <div className="flex-shrink-0 mb-6 lg:mb-0">
            <div className="relative">
              <img
                src={isEditing ? (editForm.photo || getDefaultPhoto()) : (profile.photo || getDefaultPhoto())}
                alt="Foto do perfil"
                className="w-32 h-32 rounded-full object-cover object-top mx-auto lg:mx-0"
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  target.src = getDefaultPhoto();
                }}
              />
              {isEditing && profile.userType === 'member' && (
                <label className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full cursor-pointer hover:bg-blue-700 transition-colors">
                  <i className="ri-camera-line"></i>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              )}
            </div>
            
            {/* Informações básicas */}
            <div className="text-center lg:text-left mt-4">
              <div className="bg-gray-50 rounded-lg p-3">
                <p className="text-sm font-medium text-gray-700">
                  {profile.userType === 'admin' ? 'Sistema' : 'Família'}
                </p>
                <p className="text-lg font-bold text-gray-900">{profile.familyName || 'Não informado'}</p>
              </div>
            </div>
          </div>

          {/* Profile Information */}
          <div className="flex-1">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {profile.userType === 'admin' ? 'Nome de Usuário' : 'Primeiro Nome'}
                </label>
                {/* Nome editável apenas quando pai/mãe edita filho */}
                {isEditing && isEditingChild ? (
                  <input
                    type="text"
                    value={editForm.firstName}
                    onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                ) : (
                  <p className="text-gray-800 font-medium">{profile.firstName || 'Não informado'}</p>
                )}
              </div>

              {profile.userType === 'member' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Sobrenome
                  </label>
                  {/* Sobrenome editável apenas quando pai/mãe edita filho */}
                  {isEditing && isEditingChild ? (
                    <input
                      type="text"
                      value={editForm.lastName}
                      onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <p className="text-gray-800 font-medium">{profile.lastName || 'Não informado'}</p>
                  )}
                </div>
              )}

              {profile.userType === 'member' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Data de Nascimento
                  </label>
                  {/* Data de nascimento editável apenas quando pai/mãe edita filho */}
                  {isEditing && isEditingChild ? (
                    <input
                      type="date"
                      value={editForm.birthDate}
                      onChange={(e) => setEditForm({ ...editForm, birthDate: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  ) : (
                    <div>
                      {profile.birthDate ? (
                        <>
                          <p className="text-gray-800 font-medium">
                            {formatDateCorrectly(profile.birthDate)}
                          </p>
                          <p className="text-sm text-gray-600">{calculateAge(profile.birthDate)} anos</p>
                        </>
                      ) : (
                        <p className="text-gray-500">Não informado</p>
                      )}
                    </div>
                  )}
                </div>
              )}

              {profile.userType === 'member' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gênero
                  </label>
                  {isEditing ? (
                    <select
                      value={editForm.gender}
                      onChange={(e) => setEditForm({ ...editForm, gender: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                    >
                      <option value="">Selecione</option>
                      <option value="masculino">Masculino</option>
                      <option value="feminino">Feminino</option>
                      <option value="outro">Outro</option>
                    </select>
                  ) : (
                    <p className="text-gray-800">{profile.gender || 'Não informado'}</p>
                  )}
                </div>
              )}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email
                </label>
                {isEditing && profile.userType === 'member' ? (
                  <input
                    type="email"
                    value={editForm.email}
                    onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="seu@email.com"
                  />
                ) : (
                  <p className="text-gray-800">{profile.email || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Telefone
                </label>
                {isEditing && profile.userType === 'member' ? (
                  <input
                    type="tel"
                    value={editForm.phone}
                    onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="(11) 99999-9999"
                  />
                ) : (
                  <p className="text-gray-800">{profile.phone || 'Não informado'}</p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Endereço
                </label>
                {isEditing && profile.userType === 'member' ? (
                  <input
                    type="text"
                    value={editForm.address}
                    onChange={(e) => setEditForm({ ...editForm, address: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Rua, Cidade, Estado"
                  />
                ) : (
                  <p className="text-gray-800">{profile.address || 'Não informado'}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Papel na Família
                </label>
                <p className="text-gray-800 font-medium">{profile.role}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Informações sobre edição quando é filho */}
        {isEditingChild && (
          <div className="mt-6 pt-6 border-t border-gray-200">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-start space-x-3">
                <i className="ri-information-line text-blue-600 text-lg flex-shrink-0 mt-0.5"></i>
                <div>
                  <h4 className="font-medium text-blue-800 mb-1">Edição de Filho</h4>
                  <p className="text-sm text-blue-700">
                    Como pai/mãe, você tem permissão total para editar todos os dados do seu filho, 
                    incluindo nome, sobrenome e data de nascimento.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Additional Information - apenas para perfil próprio */}
        {!isEditingChild && (
          <>
            <div className="mt-8 pt-6 border-t border-gray-200">
              <h3 className="text-lg font-medium text-gray-800 mb-4">Informações da Conta</h3>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <i className="ri-user-line text-blue-600"></i>
                    <span className="text-sm font-medium text-gray-700">Usuário</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    {localStorage.getItem('user') || 'N/A'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <i className="ri-shield-user-line text-green-600"></i>
                    <span className="text-sm font-medium text-gray-700">Tipo</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    {profile.userType === 'admin' ? 'Administrador' : 'Membro da Família'}
                  </p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex items-center space-x-2">
                    <i className="ri-calendar-line text-purple-600"></i>
                    <span className="text-sm font-medium text-gray-700">Status</span>
                  </div>
                  <p className="text-lg font-bold text-gray-800 mt-1">
                    Ativo
                  </p>
                </div>
              </div>
            </div>

            {/* Informações da família se não for admin */}
            {profile.userType === 'member' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <h3 className="text-lg font-medium text-gray-800 mb-4">Estatísticas da Família</h3>
                <div className="text-center py-8">
                  <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                    <i className="ri-family-tree-line text-2xl text-green-600"></i>
                  </div>
                  <p className="text-gray-600">
                    Visualize a árvore genealógica completa na aba "Árvore Genealógica"
                  </p>
                </div>
              </div>
            )}

            {/* Aviso para admins */}
            {profile.userType === 'admin' && (
              <div className="mt-6 pt-6 border-t border-gray-200">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <i className="ri-information-line text-blue-600 text-lg flex-shrink-0 mt-0.5"></i>
                    <div>
                      <h4 className="font-medium text-blue-800 mb-1">Perfil Administrativo</h4>
                      <p className="text-sm text-blue-700">
                        Como administrador, você tem acesso completo ao sistema mas não possui um perfil de membro da família. 
                        Para editar informações pessoais, você precisaria estar associado a um membro específico.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );

  // Se está editando um filho, renderizar como modal
  if (isEditingChild) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
        <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
          <ProfileContent />
        </div>
      </div>
    );
  }

  // Senão, renderizar normalmente
  return <ProfileContent />;
}
