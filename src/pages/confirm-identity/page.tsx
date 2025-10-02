
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FamilyService } from '../../services/familyService';

export default function ConfirmIdentity() {
  const [selectedMember, setSelectedMember] = useState<string>('');
  const [familyMembers, setFamilyMembers] = useState<any[]>([]);
  const [randomMembers, setRandomMembers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [currentUser, setCurrentUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const user = localStorage.getItem('user');
    if (!user) {
      navigate('/login');
      return;
    }

    try {
      const userData = JSON.parse(user);
      setCurrentUser(userData);
      loadFamilyData(userData.family_id);
    } catch (error) {
      console.error('Erro ao parsear dados do usuário:', error);
      navigate('/login');
    }
  }, [navigate]);

  const loadFamilyData = async (familyId: string) => {
    try {
      setLoading(true);
      
      // Buscar membros da família
      const members = await FamilyService.getFamilyMembers(familyId);
      setFamilyMembers(members);
      
      // Buscar o membro do usuário atual
      const currentMember = members.find(m => m.id === currentUser?.member_id);
      
      if (currentMember) {
        // Buscar pais do membro atual
        const parents = await FamilyService.getMemberParents(currentMember.id);
        
        // Buscar membros aleatórios (excluindo o usuário atual e seus pais)
        const excludeIds = [currentMember.id, ...parents.map(p => p.id)];
        const randomOptions = await FamilyService.getRandomMembersForChallenge(
          familyId, 
          excludeIds, 
          3
        );
        
        // Combinar pais corretos com opções aleatórias
        const allOptions = [...parents, ...randomOptions];
        
        // Embaralhar as opções
        const shuffledOptions = allOptions.sort(() => Math.random() - 0.5);
        setRandomMembers(shuffledOptions);
        
        console.log('🎯 Desafio de identidade preparado:');
        console.log('👤 Usuário atual:', `${currentMember.first_name} ${currentMember.last_name}`);
        console.log('👨‍👩‍👧‍👦 Pais corretos:', parents.map(p => `${p.first_name} ${p.last_name} (${p.role})`));
        console.log('🎲 Opções embaralhadas:', shuffledOptions.map(m => `${m.first_name} ${m.last_name} (${m.role})`));
      }
    } catch (error) {
      console.error('Erro ao carregar dados da família:', error);
      setError('Erro ao carregar dados da família');
    } finally {
      setLoading(false);
    }
  };

  const handleConfirmIdentity = async () => {
    if (!selectedMember) {
      setError('Por favor, selecione quem é seu pai ou mãe');
      return;
    }

    try {
      setLoading(true);
      setError('');

      // Verificar se a seleção está correta
      const currentMember = familyMembers.find(m => m.id === currentUser?.member_id);
      if (!currentMember) {
        setError('Membro atual não encontrado');
        return;
      }

      // Buscar pais corretos
      const correctParents = await FamilyService.getMemberParents(currentMember.id);
      const isCorrect = correctParents.some(parent => parent.id === selectedMember);

      if (isCorrect) {
        // Identidade confirmada com sucesso
        localStorage.setItem('confirmed', 'true');
        
        // Registrar login bem-sucedido
        await FamilyService.recordSuccessfulLogin(currentUser?.id || '');
        
        // Atualizar dados do usuário no localStorage
        const updatedUser = await FamilyService.getUserById(currentUser?.id || '');
        if (updatedUser) {
          localStorage.setItem('user', JSON.stringify(updatedUser));
        }
        
        navigate('/dashboard');
      } else {
        // Resposta incorreta - incrementar tentativas falhadas
        const currentAttempts = (currentUser?.failed_attempts || 0) + 1;
        await FamilyService.updateFailedAttempts(currentUser?.id || '', currentAttempts);
        
        if (currentAttempts >= 3) {
          setError('Muitas tentativas incorretas. Sua conta foi bloqueada. Entre em contato com o administrador.');
          setTimeout(() => {
            navigate('/login');
          }, 3000);
        } else {
          setError(`Resposta incorreta. Você tem ${3 - currentAttempts} tentativa(s) restante(s).`);
          // Recarregar o desafio com novas opções
          loadFamilyData(currentUser?.family_id || '');
          setSelectedMember('');
        }
      }
    } catch (error) {
      console.error('Erro ao confirmar identidade:', error);
      setError('Erro ao confirmar identidade. Tente novamente.');
    } finally {
      setLoading(false);
    }
  };

  if (loading && randomMembers.length === 0) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Preparando desafio de identidade...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-lg shadow-lg p-6">
        <div className="text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <i className="ri-shield-check-line text-2xl text-green-600"></i>
          </div>
          <h1 className="text-2xl font-bold text-gray-800 mb-2">Confirmar Identidade</h1>
          <p className="text-gray-600">
            Para sua segurança, confirme sua identidade selecionando quem é seu pai ou mãe
          </p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        <div className="space-y-3 mb-6">
          {randomMembers.map((member) => (
            <label
              key={member.id}
              className={`flex items-center p-3 border rounded-lg cursor-pointer transition-colors ${
                selectedMember === member.id
                  ? 'border-green-500 bg-green-50'
                  : 'border-gray-200 hover:border-gray-300'
              }`}
            >
              <input
                type="radio"
                name="parent"
                value={member.id}
                checked={selectedMember === member.id}
                onChange={(e) => setSelectedMember(e.target.value)}
                className="sr-only"
              />
              <div className="flex items-center space-x-3 w-full">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  {member.photo_url ? (
                    <img
                      src={member.photo_url}
                      alt={`${member.first_name} ${member.last_name}`}
                      className="w-10 h-10 rounded-full object-cover object-top"
                    />
                  ) : (
                    <div className="w-10 h-10 bg-gray-200 rounded-full flex items-center justify-center">
                      <i className="ri-user-line text-lg text-gray-500"></i>
                    </div>
                  )}
                </div>
                <div className="flex-1">
                  <p className="font-medium text-gray-800">
                    {member.first_name} {member.last_name}
                  </p>
                  <p className="text-sm text-gray-600">{member.role}</p>
                </div>
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedMember === member.id
                    ? 'border-green-500 bg-green-500'
                    : 'border-gray-300'
                }`}>
                  {selectedMember === member.id && (
                    <div className="w-full h-full rounded-full bg-white scale-50"></div>
                  )}
                </div>
              </div>
            </label>
          ))}
        </div>

        <button
          onClick={handleConfirmIdentity}
          disabled={!selectedMember || loading}
          className="w-full bg-green-600 text-white py-3 px-4 rounded-lg font-medium hover:bg-green-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Verificando...' : 'Confirmar Identidade'}
        </button>

        <div className="mt-4 text-center">
          <button
            onClick={() => navigate('/login')}
            className="text-gray-600 hover:text-gray-800 text-sm transition-colors"
          >
            Voltar ao login
          </button>
        </div>
      </div>
    </div>
  );
}
