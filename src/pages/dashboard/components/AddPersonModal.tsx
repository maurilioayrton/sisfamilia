
import { useState, useEffect } from 'react';
import { FamilyService } from '../../../services/familyService';

interface AddPersonModalProps {
  onClose: () => void;
  isAdmin: boolean;
  currentFamily: string;
  families: any[];
  onFamilyCreated: () => void;
  parentId?: string | null;
}

export default function AddPersonModal({ 
  onClose, 
  isAdmin, 
  currentFamily, 
  families, 
  onFamilyCreated,
  parentId 
}: AddPersonModalProps) {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    birthDate: '',
    gender: '',
    email: '',
    phone: '',
    address: '',
    photoUrl: '',
    role: '',
    familyId: currentFamily || '',
    familyName: '',
    parentId: parentId || '',
    createUser: false,
    username: '',
    password: '',
    is_deceased: false as boolean
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isCreatingFamily, setIsCreatingFamily] = useState(!currentFamily);
  const [availableParents, setAvailableParents] = useState<any[]>([]);
  const [userMember, setUserMember] = useState<any>(null);

  useEffect(() => {
    if (currentFamily) {
      loadAvailableParents();
    }
    
    // Se não é admin, carregar dados do membro do usuário
    if (!isAdmin) {
      loadUserMember();
    }
  }, [currentFamily, isAdmin]);

  const loadUserMember = async () => {
    try {
      const userId = localStorage.getItem('userId');
      if (userId) {
        const userData = await FamilyService.getUserById(userId);
        if (userData && userData.member_id) {
          const member = await FamilyService.getMemberById(userData.member_id);
          setUserMember(member);
          
          // Se tem parentId definido, usar ele como pai
          if (parentId) {
            setFormData(prev => ({ ...prev, parentId }));
          } else if (member) {
            // Caso contrário, usar o próprio usuário como pai
            setFormData(prev => ({ ...prev, parentId: member.id }));
          }
        }
      }
    } catch (error) {
      console.error('Erro ao carregar dados do usuário:', error);
    }
  };

  const loadAvailableParents = async () => {
    try {
      const members = await FamilyService.getFamilyMembers(currentFamily);
      setAvailableParents(members);
    } catch (error) {
      console.error('Erro ao carregar membros da família:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');

    try {
      let familyId = formData.familyId;

      // Se está criando uma nova família
      if (isCreatingFamily && isAdmin) {
        if (!formData.familyName.trim()) {
          setError('Nome da família é obrigatório');
          return;
        }

        const userId = localStorage.getItem('userId');
        const newFamily = await FamilyService.createFamily(
          formData.familyName.trim(),
          userId || undefined
        );
        familyId = newFamily.id;
        setFormData(prev => ({ ...prev, familyId }));
      }

      if (!familyId) {
        setError('Família deve ser selecionada ou criada');
        return;
      }

      // Validações básicas
      if (!formData.firstName.trim() || !formData.lastName.trim()) {
        setError('Nome e sobrenome são obrigatórios');
        return;
      }

      // Determinar o papel baseado no contexto
      let memberRole = formData.role;
      if (!memberRole) {
        if (isCreatingFamily) {
          // Se está criando família, é patriarca/matriarca
          memberRole = formData.gender === 'feminino' ? 'Matriarca' : 'Patriarca';
        } else if (!isAdmin && userMember) {
          // Se não é admin, está adicionando filho
          memberRole = formData.gender === 'feminino' ? 'Filha' : 'Filho';
        } else {
          // Caso padrão
          memberRole = 'Membro da família';
        }
      }

      // Criar membro da família
      const memberData = {
        family_id: familyId,
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        birth_date: formData.birthDate || undefined,
        gender: formData.gender || undefined,
        email: formData.email || undefined,
        phone: formData.phone || undefined,
        address: formData.address || undefined,
        photo_url: formData.photoUrl || undefined,
        role: memberRole,
        parent_id: formData.parentId || undefined,
        created_by: localStorage.getItem('userId') || undefined,
        is_deceased: formData.is_deceased === true || formData.is_deceased === 'true'
      };

      const newMember = await FamilyService.addFamilyMember(memberData);
      
      if (!newMember) {
        throw new Error('Falha ao criar membro da família');
      }

      // Criar usuário do sistema se solicitado
      if (formData.createUser && formData.username && formData.password) {
        try {
          const userData = {
            username: formData.username.trim(),
            family_id: familyId,
            member_id: newMember.id,
            user_type: 'member' as const,
            is_active: true,
            is_first_login: true,
            failed_attempts: 0,
            is_blocked: false,
            password_hash: formData.password // Em produção, isso deveria ser hasheado
          };

          await FamilyService.createSystemUser(userData);
          setSuccess(`Membro e usuário criados com sucesso! Username: ${formData.username}`);
        } catch (userError) {
          console.error('Erro ao criar usuário:', userError);
          setSuccess('Membro criado com sucesso, mas houve erro ao criar o usuário do sistema.');
        }
      } else {
        setSuccess('Membro adicionado com sucesso!');
      }

      // Resetar formulário
      setFormData({
        firstName: '',
        lastName: '',
        birthDate: '',
        gender: '',
        email: '',
        phone: '',
        address: '',
        photoUrl: '',
        role: '',
        familyId: familyId,
        familyName: '',
        parentId: parentId || '',
        createUser: false,
        username: '',
        password: '',
        is_deceased: false
      });

      // Notificar componente pai
      onFamilyCreated();

      // Fechar modal após 2 segundos
      setTimeout(() => {
        onClose();
      }, 2000);

    } catch (error) {
      console.error('Erro ao adicionar pessoa:', error);
      setError(error instanceof Error ? error.message : 'Erro desconhecido');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl font-bold text-gray-800">
              {isCreatingFamily ? 'Criar Nova Família' : (isAdmin ? 'Adicionar Pessoa' : 'Adicionar Filho')}
            </h2>
            <button 
              onClick={onClose} 
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <i className="ri-close-line text-2xl"></i>
            </button>
          </div>

          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-red-700 text-sm">{error}</p>
            </div>
          )}

          {success && (
            <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
              <p className="text-green-700 text-sm">{success}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Seleção/Criação de Família - apenas para admin */}
            {isAdmin && (
              <div className="space-y-4 p-4 bg-blue-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={!isCreatingFamily}
                      onChange={() => setIsCreatingFamily(false)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Adicionar a família existente</span>
                  </label>
                  <label className="flex items-center">
                    <input
                      type="radio"
                      checked={isCreatingFamily}
                      onChange={() => setIsCreatingFamily(true)}
                      className="mr-2"
                    />
                    <span className="text-sm font-medium">Criar nova família</span>
                  </label>
                </div>

                {isCreatingFamily ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nome da Nova Família *
                    </label>
                    <input
                      type="text"
                      value={formData.familyName}
                      onChange={(e) => setFormData(prev => ({ ...prev, familyName: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Ex: Família Silva"
                      required
                    />
                  </div>
                ) : (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Selecionar Família *
                    </label>
                    <select
                      value={formData.familyId}
                      onChange={(e) => setFormData(prev => ({ ...prev, familyId: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                      required
                    >
                      <option value="">Selecione uma família</option>
                      {families.map((family) => (
                        <option key={family.id} value={family.id}>
                          {family.name}
                        </option>
                      ))}
                    </select>
                  </div>
                )}
              </div>
            )}

            {/* Informações Pessoais */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nome *
                </label>
                <input
                  type="text"
                  value={formData.firstName}
                  onChange={(e) => setFormData(prev => ({ ...prev, firstName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sobrenome *
                </label>
                <input
                  type="text"
                  value={formData.lastName}
                  onChange={(e) => setFormData(prev => ({ ...prev, lastName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Data de Nascimento
                </label>
                <input
                  type="date"
                  value={formData.birthDate}
                  onChange={(e) => setFormData(prev => ({ ...prev, birthDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Gênero
                </label>
                <select
                  value={formData.gender}
                  onChange={(e) => setFormData(prev => ({ ...prev, gender: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="">Selecione</option>
                  <option value="masculino">Masculino</option>
                  <option value="feminino">Feminino</option>
                  <option value="outro">Outro</option>
                </select>
              </div>
            </div>

            {/* Papel na Família */}
            {isAdmin && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Papel na Família
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                >
                  <option value="">Automático (baseado no contexto)</option>
                  <option value="Patriarca">Patriarca</option>
                  <option value="Matriarca">Matriarca</option>
                  <option value="Pai">Pai</option>
                  <option value="Mãe">Mãe</option>
                  <option value="Filho">Filho</option>
                  <option value="Filha">Filha</option>
                  <option value="Avô">Avô</option>
                  <option value="Avó">Avó</option>
                  <option value="Neto">Neto</option>
                  <option value="Neta">Neta</option>
                  <option value="Tio">Tio</option>
                  <option value="Tia">Tia</option>
                  <option value="Primo">Primo</option>
                  <option value="Prima">Prima</option>
                  <option value="Membro da família">Membro da família</option>
                </select>
              </div>
            )}

            {/* Parentesco - apenas para admin ou quando há pais disponíveis */}
            {(isAdmin || availableParents.length > 0) && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Pai/Mãe {!isAdmin && '(Opcional)'}
                </label>
                <select
                  value={formData.parentId}
                  onChange={(e) => setFormData(prev => ({ ...prev, parentId: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent pr-8"
                  disabled={!isAdmin && !!parentId} // Se não é admin e tem parentId definido, desabilitar
                >
                  <option value="">Nenhum (membro independente)</option>
                  {availableParents.map((parent) => (
                    <option key={parent.id} value={parent.id}>
                      {parent.first_name} {parent.last_name} ({parent.role})
                    </option>
                  ))}
                </select>
                {!isAdmin && userMember && (
                  <p className="text-xs text-gray-500 mt-1">
                    Como {userMember.role?.toLowerCase()}, você está adicionando um filho. 
                    O parentesco será definido automaticamente.
                  </p>
                )}
              </div>
            )}

            {/* Contato */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Telefone
                </label>
                <input
                  type="tel"
                  value={formData.phone}
                  onChange={(e) => setFormData(prev => ({ ...prev, phone: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Endereço
              </label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                URL da Foto
              </label>
              <input
                type="url"
                value={formData.photoUrl}
                onChange={(e) => setFormData(prev => ({ ...prev, photoUrl: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="https://exemplo.com/foto.jpg"
              />
            </div>

            {/* Criar Usuário do Sistema - apenas para admin */}
            {isAdmin && (
              <div className="space-y-4 p-4 bg-gray-50 rounded-lg">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={formData.createUser}
                    onChange={(e) => setFormData(prev => ({ ...prev, createUser: e.target.checked }))}
                    className="mr-2"
                  />
                  <span className="text-sm font-medium">Criar usuário do sistema para esta pessoa</span>
                </label>

                {formData.createUser && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nome de Usuário *
                      </label>
                      <input
                        type="text"
                        value={formData.username}
                        onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={formData.createUser}
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Senha Temporária *
                      </label>
                      <input
                        type="password"
                        value={formData.password}
                        onChange={(e) => setFormData(prev => ({ ...prev, password: e.target.value }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        required={formData.createUser}
                      />
                    </div>
                  </div>
                )}
              </div>
            )}

            <div className="flex justify-end space-x-3 pt-4">
              <button
                type="button"
                onClick={onClose}
                className="bg-gray-100 text-gray-700 px-6 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={loading}
                className="bg-green-600 text-white px-6 py-3 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50"
              >
                {loading ? 'Salvando...' : (isCreatingFamily ? 'Criar Família' : 'Adicionar Pessoa')}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
