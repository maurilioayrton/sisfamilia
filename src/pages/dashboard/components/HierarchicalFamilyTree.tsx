
import { useState, useEffect } from 'react';
import { FamilyService } from '../../../services/familyService';

interface HierarchicalFamilyTreeProps {
  currentFamily: string;
  isAdmin: boolean;
}

interface FamilyMember {
  id: string;
  first_name: string;
  last_name: string;
  birth_date: string;
  photo_url?: string;
  role: string;
  parent_id?: string;
  gender: string;
  family_id: string;
}

interface Generation {
  level: number;
  members: FamilyMember[];
}

export default function HierarchicalFamilyTree({ currentFamily, isAdmin }: HierarchicalFamilyTreeProps) {
  const [familyData, setFamilyData] = useState<any>(null);
  const [generations, setGenerations] = useState<Generation[]>([]);
  const [loading, setLoading] = useState(false);
  const [patriarch, setPatriarch] = useState<FamilyMember | null>(null);
  const [matriarch, setMatriarch] = useState<FamilyMember | null>(null);

  // Carregar dados da família
  const loadFamilyData = async () => {
    try {
      setLoading(true);
      const familyMembers = await FamilyService.getFamilyMembers(currentFamily);
      
      const processedMembers: FamilyMember[] = familyMembers.map(member => ({
        id: member.id,
        first_name: member.first_name,
        last_name: member.last_name,
        birth_date: member.birth_date || '',
        photo_url: member.photo_url,
        role: member.role,
        parent_id: member.parent_id,
        gender: member.gender || '',
        family_id: member.family_id
      }));
      
      setFamilyData({
        name: 'Família',
        members: processedMembers
      });
      
      // Construir hierarquia
      buildHierarchy(processedMembers);
    } catch (error) {
      console.error('Erro ao carregar dados da família:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (currentFamily) {
      loadFamilyData();
    }
  }, [currentFamily]);

  // Organizar membros em hierarquia de gerações
  const buildHierarchy = (members: FamilyMember[]) => {
    // Encontrar patriarca e matriarca (sem parent_id e com roles específicos)
    const patriarchMember = members.find(m => 
      !m.parent_id && (m.role === 'Patriarca' || (m.role === 'Pai' && m.gender === 'masculino'))
    );
    
    const matriarchMember = members.find(m => 
      !m.parent_id && (m.role === 'Matriarca' || (m.role === 'Mãe' && m.gender === 'feminino'))
    );

    setPatriarch(patriarchMember || null);
    setMatriarch(matriarchMember || null);

    // Organizar por gerações
    const generationMap = new Map<number, FamilyMember[]>();
    
    // Função recursiva para calcular nível de geração
    const calculateGeneration = (member: FamilyMember, visited = new Set<string>()): number => {
      if (visited.has(member.id)) return 0; // Evitar loops infinitos
      visited.add(member.id);
      
      if (!member.parent_id) return 1; // Primeira geração (patriarca/matriarca)
      
      const parent = members.find(m => m.id === member.parent_id);
      if (!parent) return 1;
      
      return calculateGeneration(parent, visited) + 1;
    };

    // Calcular geração para cada membro
    members.forEach(member => {
      const generation = calculateGeneration(member);
      
      if (!generationMap.has(generation)) {
        generationMap.set(generation, []);
      }
      
      generationMap.get(generation)!.push(member);
    });

    // Converter para array ordenado
    const generationsArray: Generation[] = [];
    for (let level = 1; level <= Math.max(...generationMap.keys()); level++) {
      const membersInLevel = generationMap.get(level) || [];
      if (membersInLevel.length > 0) {
        generationsArray.push({
          level,
          members: membersInLevel.sort((a, b) => {
            // Ordenar por data de nascimento se disponível
            if (a.birth_date && b.birth_date) {
              return new Date(a.birth_date).getTime() - new Date(b.birth_date).getTime();
            }
            return a.first_name.localeCompare(b.first_name);
          })
        });
      }
    }

    setGenerations(generationsArray);
  };

  const getDefaultPhoto = () => {
    return 'https://readdy.ai/api/search-image?query=professional%20family%20portrait%20placeholder%2C%20neutral%20background%2C%20elegant%20frame%2C%20genealogy%20tree%20member%20photo%2C%20classic%20family%20photography%20style&width=120&height=120&seq=family-member&orientation=squarish';
  };

  const formatDate = (dateString: string) => {
    if (!dateString) return '';
    // Criar data sem conversão de fuso horário para evitar problema de um dia a menos
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR');
  };

  const getGenerationLabel = (level: number) => {
    switch (level) {
      case 1: return 'Fundadores';
      case 2: return 'Filhos';
      case 3: return 'Netos';
      case 4: return 'Bisnetos';
      case 5: return 'Trinetos';
      default: return `${level}ª Geração`;
    }
  };

  const renderMember = (member: FamilyMember, _memberIndex: number, level: number) => {
    return null;
  };

  if (!currentFamily && !isAdmin) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-error-warning-line text-4xl text-red-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Acesso Negado</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Você precisa estar associado a uma família para visualizar a árvore genealógica.
          </p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-16">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Carregando árvore genealógica...</p>
        </div>
      </div>
    );
  }

  if (!familyData || !familyData.members || familyData.members.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <i className="ri-family-tree-line text-4xl text-gray-400"></i>
          </div>
          <h3 className="text-lg font-medium text-gray-800 mb-2">Família sem membros</h3>
          <p className="text-gray-600 mb-6 max-w-md mx-auto">
            Esta família ainda não possui membros cadastrados para exibir a árvore genealógica.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow">
      {/* Header */}
      <div className="px-4 sm:px-6 py-3 sm:py-4 border-b border-gray-200">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center space-y-2 sm:space-y-0">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-gray-800">Árvore Genealógica Hierárquica</h2>
            <p className="text-xs sm:text-sm text-gray-600">{familyData.name}</p>
          </div>
          <div className="flex items-center space-x-2">
            <span className="bg-green-100 text-green-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
              {familyData.members.length} membros
            </span>
            <span className="bg-blue-100 text-blue-800 text-xs sm:text-sm px-2 sm:px-3 py-1 rounded-full">
              {generations.length} gerações
            </span>
          </div>
        </div>
      </div>

      {/* Árvore Genealógica */}
      <div className="p-4 sm:p-6 lg:p-8 bg-gradient-to-b from-gray-50 to-white min-h-screen">
        <div className="max-w-full overflow-x-auto">
          <div className="min-w-max">
            {/* Primeira Geração - Patriarca e Matriarca */}
            {(patriarch || matriarch) && (
              <div className="mb-12 sm:mb-16">
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">Fundadores da Família</h3>
                  <div className="w-16 sm:w-24 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-auto rounded-full"></div>
                </div>
                
                <div className="flex justify-center items-center space-x-8 sm:space-x-16">
                  {/* Patriarca */}
                  {patriarch && (
                    <div className="text-center">
                      <div className="relative mb-3 sm:mb-4 group">
                        <div className={`w-20 h-20 sm:w-32 sm:h-32 rounded-full border-3 sm:border-4 shadow-lg overflow-hidden bg-white transition-all duration-300 group-hover:shadow-xl ${patriarch.gender === 'masculino' ? 'border-blue-200 group-hover:ring-4 group-hover:ring-blue-300' : patriarch.gender === 'feminino' ? 'border-pink-200 group-hover:ring-4 group-hover:ring-pink-300' : 'border-gray-200 group-hover:ring-4 group-hover:ring-gray-300'}`}>
                          <img
                            src={patriarch.photo_url || getDefaultPhoto()}
                            alt={`${patriarch.first_name} ${patriarch.last_name}`}
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = getDefaultPhoto();
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-blue-600 rounded-full flex items-center justify-center">
                          <i className="ri-user-line text-white text-xs sm:text-sm"></i>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-blue-100 hover:shadow-lg transition-shadow duration-300 max-w-xs">
                        <h4 className="font-bold text-gray-800 text-sm sm:text-lg">{patriarch.first_name} {patriarch.last_name}</h4>
                        <p className="text-blue-600 font-medium text-xs sm:text-sm">{patriarch.role}</p>
                        {patriarch.birth_date && (
                          <p className="text-gray-600 text-xs sm:text-sm">{formatDate(patriarch.birth_date)}</p>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Linha de conexão entre patriarca e matriarca */}
                  {patriarch && matriarch && (
                    <div className="flex items-center">
                      <div className="w-8 sm:w-16 h-1 bg-gradient-to-r from-blue-400 to-pink-400 rounded-full"></div>
                      <div className="w-3 h-3 sm:w-4 sm:h-4 bg-red-400 rounded-full mx-1 sm:mx-2 flex items-center justify-center">
                        <i className="ri-heart-fill text-white text-xs"></i>
                      </div>
                      <div className="w-8 sm:w-16 h-1 bg-gradient-to-r from-pink-400 to-blue-400 rounded-full"></div>
                    </div>
                  )}

                  {/* Matriarca */}
                  {matriarch && (
                    <div className="text-center">
                      <div className="relative mb-3 sm:mb-4 group">
                        <div className={`w-20 h-20 sm:w-32 sm:h-32 rounded-full border-3 sm:border-4 shadow-lg overflow-hidden bg-white transition-all duration-300 group-hover:shadow-xl ${matriarch.gender === 'masculino' ? 'border-blue-200 group-hover:ring-4 group-hover:ring-blue-300' : matriarch.gender === 'feminino' ? 'border-pink-200 group-hover:ring-4 group-hover:ring-pink-300' : 'border-gray-200 group-hover:ring-4 group-hover:ring-gray-300'}`}>
                          <img
                            src={matriarch.photo_url || getDefaultPhoto()}
                            alt={`${matriarch.first_name} ${matriarch.last_name}`}
                            className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                            onError={(e) => {
                              const target = e.target as HTMLImageElement;
                              target.src = getDefaultPhoto();
                            }}
                          />
                        </div>
                        <div className="absolute -bottom-1 sm:-bottom-2 -right-1 sm:-right-2 w-6 h-6 sm:w-8 sm:h-8 bg-pink-600 rounded-full flex items-center justify-center">
                          <i className="ri-user-line text-white text-xs sm:text-sm"></i>
                        </div>
                      </div>
                      <div className="bg-white rounded-xl shadow-md p-3 sm:p-4 border border-pink-100 hover:shadow-lg transition-shadow duration-300 max-w-xs">
                        <h4 className="font-bold text-gray-800 text-sm sm:text-lg">{matriarch.first_name} {matriarch.last_name}</h4>
                        <p className="text-pink-600 font-medium text-xs sm:text-sm">{matriarch.role}</p>
                        {matriarch.birth_date && (
                          <p className="text-gray-600 text-xs sm:text-sm">{formatDate(matriarch.birth_date)}</p>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Demais Gerações */}
            {generations.slice(1).map((generation, index) => (
              <div key={generation.level} className="mb-12 sm:mb-16">
                {/* Linha de conexão vertical da geração anterior */}
                {index === 0 && (patriarch || matriarch) && (
                  <div className="flex justify-center mb-6 sm:mb-8">
                    <div className="w-1 h-8 sm:h-12 bg-gradient-to-b from-gray-400 to-green-400 rounded-full"></div>
                  </div>
                )}

                {/* Título da Geração */}
                <div className="text-center mb-6 sm:mb-8">
                  <h3 className="text-base sm:text-lg font-bold text-gray-800 mb-2">{getGenerationLabel(generation.level)}</h3>
                  <div className="w-12 sm:w-20 h-1 bg-gradient-to-r from-green-400 to-blue-400 mx-auto rounded-full"></div>
                </div>

                {/* Linha horizontal conectando todos os membros da geração */}
                {generation.members.length > 1 && (
                  <div className="flex justify-center mb-4 sm:mb-6">
                    <div className="flex items-center">
                      <div className="w-4 sm:w-8 h-1 bg-gray-300 rounded-full"></div>
                      {generation.members.slice(1).map((_, i) => (
                        <div key={i} className="flex items-center">
                          <div className="w-8 sm:w-16 h-1 bg-gray-300"></div>
                          <div className="w-1.5 h-1.5 sm:w-2 sm:h-2 bg-gray-400 rounded-full"></div>
                        </div>
                      ))}
                      <div className="w-4 sm:w-8 h-1 bg-gray-300 rounded-full"></div>
                    </div>
                  </div>
                )}

                {/* Membros da Geração */}
                <div className="flex justify-center">
                  <div className="grid gap-4 sm:gap-6 lg:gap-8" style={{ 
                    gridTemplateColumns: `repeat(${Math.min(generation.members.length, 6)}, 1fr)` 
                  }}>
                    {generation.members.map((member, _memberIndex) => (
                      <div key={member.id} className="text-center">
                        {/* Linha de conexão vertical para este membro */}
                        <div className="flex justify-center mb-3 sm:mb-4">
                          <div className="w-1 h-6 sm:h-8 bg-gray-300 rounded-full"></div>
                        </div>

                        <div className="relative mb-3 sm:mb-4 group">
                          <div className={`w-16 h-16 sm:w-24 sm:h-24 rounded-full border-2 sm:border-3 shadow-lg overflow-hidden bg-white transition-all duration-300 group-hover:shadow-xl ${
                            member.gender === 'masculino' 
                              ? 'border-blue-200 group-hover:ring-4 group-hover:ring-blue-300' 
                              : member.gender === 'feminino' 
                                ? 'border-pink-200 group-hover:ring-4 group-hover:ring-pink-300' 
                                : 'border-gray-200 group-hover:ring-4 group-hover:ring-gray-300'
                          }`}>
                            <img
                              src={member.photo_url || getDefaultPhoto()}
                              alt={`${member.first_name} ${member.last_name}`}
                              className="w-full h-full object-cover object-top transition-transform duration-300 group-hover:scale-105"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = getDefaultPhoto();
                              }}
                            />
                          </div>
                          <div className={`absolute -bottom-0.5 sm:-bottom-1 -right-0.5 sm:-right-1 w-5 h-5 sm:w-6 sm:h-6 rounded-full flex items-center justify-center ${
                            member.gender === 'masculino' 
                              ? 'bg-blue-500' 
                              : member.gender === 'feminino' 
                                ? 'bg-pink-500' 
                                : 'bg-gray-500'
                          }`}>
                            <i className="ri-user-line text-white text-xs"></i>
                          </div>
                        </div>

                        <div className="bg-white rounded-xl shadow-md p-2 sm:p-3 border border-gray-100 max-w-xs hover:shadow-lg transition-shadow duration-300">
                          <h4 className="font-bold text-gray-800 text-xs sm:text-sm truncate">{member.first_name} {member.last_name}</h4>
                          <p className={`font-medium text-xs ${
                            member.gender === 'masculino' 
                              ? 'text-blue-600' 
                              : member.gender === 'feminino' 
                                ? 'text-pink-600' 
                                : 'text-gray-600'
                          }`}>
                            {member.role}
                          </p>
                          {member.birth_date && (
                            <p className="text-gray-600 text-xs">{formatDate(member.birth_date)}</p>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Linha de conexão para próxima geração */}
                {index < generations.slice(1).length - 1 && (
                  <div className="flex justify-center mt-6 sm:mt-8">
                    <div className="w-1 h-8 sm:h-12 bg-gradient-to-b from-green-400 to-blue-400 rounded-full"></div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Estatísticas da Família */}
        <div className="mt-12 sm:mt-16 bg-gradient-to-r from-green-50 to-blue-50 rounded-xl p-4 sm:p-6 border border-gray-200">
          <h4 className="font-bold text-gray-800 mb-3 sm:mb-4 text-center text-sm sm:text-base">Estatísticas da Família</h4>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 text-center">
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <p className="text-green-600 font-medium text-xs sm:text-sm">Total de Membros</p>
              <p className="font-bold text-green-800 text-lg sm:text-xl">{familyData.members.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <p className="text-blue-600 font-medium text-xs sm:text-sm">Gerações</p>
              <p className="font-bold text-blue-800 text-lg sm:text-xl">{generations.length}</p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <p className="text-purple-600 font-medium text-xs sm:text-sm">Homens</p>
              <p className="font-bold text-purple-800 text-lg sm:text-xl">
                {familyData.members.filter((m: any) => m.gender === 'masculino').length}
              </p>
            </div>
            <div className="bg-white rounded-lg p-3 sm:p-4 shadow-sm">
              <p className="text-pink-600 font-medium text-xs sm:text-sm">Mulheres</p>
              <p className="font-bold text-pink-800 text-lg sm:text-xl">
                {familyData.members.filter((m: any) => m.gender === 'feminino').length}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
