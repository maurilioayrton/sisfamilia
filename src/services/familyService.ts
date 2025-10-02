
import { supabase, Family, FamilyMember, SystemUser } from '../lib/supabase';

export class FamilyService {
  // Testar conexão com Supabase - versão melhorada
  static async testConnection(): Promise<boolean> {
    try {
      console.log('🔄 Testando conexão com Supabase...');
      
      // Primeiro, testar se o cliente Supabase está configurado
      if (!supabase) {
        console.error('❌ Cliente Supabase não configurado');
        return false;
      }

      // Testar com uma query simples que sempre funciona
      const { data, error } = await supabase
        .from('families')
        .select('id', { count: 'exact', head: true })
        .limit(1);

      if (error) {
        console.error('❌ Erro na conexão com Supabase:', error);
        console.error('Detalhes do erro:', {
          message: error.message,
          code: error.code,
          details: error.details,
          hint: error.hint
        });
        return false;
      }

      console.log('✅ Conexão com Supabase estabelecida com sucesso!');
      console.log('📊 Resposta do servidor:', data);
      return true;
    } catch (error) {
      console.error('❌ Erro crítico ao testar conexão:', error);
      return false;
    }
  }

  // Verificar se as tabelas existem
  static async checkTables(): Promise<{ families: boolean; members: boolean; users: boolean }> {
    const results = { families: false, members: false, users: false };
    
    try {
      // Testar tabela families
      const { error: familiesError } = await supabase
        .from('families')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      
      results.families = !familiesError;
      
      // Testar tabela family_members
      const { error: membersError } = await supabase
        .from('family_members')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      
      results.members = !membersError;
      
      // Testar tabela system_users
      const { error: usersError } = await supabase
        .from('system_users')
        .select('id', { count: 'exact', head: true })
        .limit(1);
      
      results.users = !usersError;
      
      console.log('📋 Status das tabelas:', results);
      return results;
    } catch (error) {
      console.error('❌ Erro ao verificar tabelas:', error);
      return results;
    }
  }

  // Criar nova família - versão corrigida
  static async createFamily(name: string, createdBy?: string): Promise<Family> {
    const slug = name.toLowerCase()
      .replace(/família\s+/g, '')
      .replace(/\s+/g, '_')
      .replace(/[^a-z0-9_]/g, '');

    try {
      console.log('🏠 Criando família:', { name, slug, createdBy });
      
      const { data, error } = await supabase
        .from('families')
        .insert({
          name,
          slug,
          created_by: createdBy || null
        })
        .select()
        .single();

      if (error) {
        console.error('❌ Erro detalhado ao criar família:', error);
        throw new Error(`Erro ao criar família: ${error.message}`);
      }
      
      console.log('✅ Família criada com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no createFamily:', error);
      throw error;
    }
  }

  // Buscar todas as famílias com contagem de membros - versão corrigida
  static async getFamilies(): Promise<(Family & { members: number })[]> {
    try {
      console.log('🔍 Buscando famílias...');
      
      // Buscar famílias
      const { data: familiesData, error: familiesError } = await supabase
        .from('families')
        .select('*')
        .order('created_at', { ascending: false });

      if (familiesError) {
        console.error('❌ Erro ao buscar famílias:', familiesError);
        return [];
      }

      if (!familiesData || familiesData.length === 0) {
        console.log('📭 Nenhuma família encontrada');
        return [];
      }

      console.log('📋 Famílias encontradas:', familiesData.length);

      // Adicionar contagem de membros para cada família
      const familiesWithMembers = await Promise.all(
        familiesData.map(async (family) => {
          try {
            const { count, error: countError } = await supabase
              .from('family_members')
              .select('*', { count: 'exact', head: true })
              .eq('family_id', family.id);

            if (countError) {
              console.warn(`⚠️ Erro ao contar membros da família ${family.id}:`, countError);
              return { ...family, members: 0 };
            }

            return { ...family, members: count || 0 };
          } catch (memberError) {
            console.warn(`⚠️ Erro ao contar membros da família ${family.id}:`, memberError);
            return { ...family, members: 0 };
          }
        })
      );

      console.log('✅ Famílias processadas com contagem de membros');
      return familiesWithMembers;
    } catch (error) {
      console.error('❌ Erro no getFamilies:', error);
      return [];
    }
  }

  // Buscar família por ID - versão corrigida
  static async getFamilyById(id: string): Promise<Family | null> {
    try {
      console.log('🔍 Buscando família por ID:', id);
      
      const { data, error } = await supabase
        .from('families')
        .select('*')
        .eq('id', id)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📭 Família não encontrada:', id);
          return null;
        }
        console.error('❌ Erro ao buscar família por ID:', error);
        return null;
      }
      
      console.log('✅ Família encontrada:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no getFamilyById:', error);
      return null;
    }
  }

  // Buscar membros de uma família - versão corrigida
  static async getFamilyMembers(familyId: string): Promise<FamilyMember[]> {
    try {
      console.log('👥 Buscando membros da família:', familyId);
      
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .order('created_at', { ascending: true });

      if (error) {
        console.error('❌ Erro ao buscar membros da família:', error);
        return [];
      }
      
      console.log('✅ Membros encontrados:', data?.length || 0);
      return data || [];
    } catch (error) {
      console.error('❌ Erro no getFamilyMembers:', error);
      return [];
    }
  }

  // Adicionar membro à família - versão corrigida
  static async addFamilyMember(member: Omit<FamilyMember, 'id' | 'created_at' | 'updated_at'>): Promise<FamilyMember | null> {
    try {
      console.log('👤 Adicionando membro:', member);
      
      const { data, error } = await supabase
        .from('family_members')
        .insert(member)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro detalhado ao adicionar membro:', error);
        throw new Error(`Erro ao adicionar membro: ${error.message}`);
      }
      
      console.log('✅ Membro adicionado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no addFamilyMember:', error);
      throw error;
    }
  }

  // Buscar usuário do sistema por username - versão corrigida
  static async getUserByUsername(username: string): Promise<SystemUser | null> {
    try {
      console.log('👤 Buscando usuário:', username);
      
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .eq('username', username)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar usuário:', error);
        return null;
      }
      
      console.log('✅ Usuário encontrado:', data ? 'Sim' : 'Não');
      return data;
    } catch (error) {
      console.error('❌ Erro no getUserByUsername:', error);
      return null;
    }
  }

  // Atualizar tentativas de login falhadas
  static async updateFailedAttempts(userId: string, attempts: number): Promise<void> {
    try {
      const updateData: any = { 
        failed_attempts: attempts,
        updated_at: new Date().toISOString()
      };
      
      // Se chegou a 3 tentativas, bloquear usuário
      if (attempts >= 3) {
        updateData.is_blocked = true;
        updateData.blocked_at = new Date().toISOString();
      }
      
      const { error } = await supabase
        .from('system_users')
        .update(updateData)
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao atualizar tentativas:', error);
        throw error;
      }
      
      console.log('✅ Tentativas atualizadas:', attempts);
    } catch (error) {
      console.error('❌ Erro no updateFailedAttempts:', error);
      throw error;
    }
  }

  // Resetar tentativas de login
  static async resetFailedAttempts(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_users')
        .update({ 
          failed_attempts: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao resetar tentativas:', error);
        throw error;
      }
      
      console.log('✅ Tentativas resetadas');
    } catch (error) {
      console.error('❌ Erro no resetFailedAttempts:', error);
      throw error;
    }
  }

  // Atualizar senha do usuário
  static async updateUserPassword(userId: string, newPasswordHash: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_users')
        .update({ 
          password_hash: newPasswordHash,
          is_first_login: false,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao atualizar senha:', error);
        throw error;
      }
      
      console.log('✅ Senha atualizada');
    } catch (error) {
      console.error('❌ Erro no updateUserPassword:', error);
      throw error;
    }
  }

  // Registrar login bem-sucedido
  static async recordSuccessfulLogin(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_users')
        .update({ 
          last_login: new Date().toISOString(),
          failed_attempts: 0,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao registrar login:', error);
        throw error;
      }
      
      console.log('✅ Login registrado');
    } catch (error) {
      console.error('❌ Erro no recordSuccessfulLogin:', error);
      throw error;
    }
  }

  // Buscar membro por ID
  static async getMemberById(memberId: string): Promise<FamilyMember | null> {
    try {
      console.log('👤 Buscando membro por ID:', memberId);
      
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('id', memberId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📭 Membro não encontrado:', memberId);
          return null;
        }
        console.error('❌ Erro ao buscar membro por ID:', error);
        return null;
      }
      
      console.log('✅ Membro encontrado:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no getMemberById:', error);
      return null;
    }
  }

  // Atualizar dados do membro da família - NOVA FUNÇÃO
  static async updateFamilyMember(memberId: string, updateData: Partial<FamilyMember>): Promise<FamilyMember | null> {
    try {
      console.log('🔄 Atualizando membro:', memberId, updateData);
      
      const { data, error } = await supabase
        .from('family_members')
        .update({
          ...updateData,
          updated_at: new Date().toISOString()
        })
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao atualizar membro:', error);
        throw new Error(`Erro ao atualizar membro: ${error.message}`);
      }
      
      console.log('✅ Membro atualizado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no updateFamilyMember:', error);
      throw error;
    }
  }

  // Buscar usuário por ID - NOVA FUNÇÃO
  static async getUserById(userId: string): Promise<SystemUser | null> {
    try {
      console.log('👤 Buscando usuário por ID:', userId);
      
      const { data, error } = await supabase
        .from('system_users')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        if (error.code === 'PGRST116') {
          console.log('📭 Usuário não encontrado:', userId);
          return null;
        }
        console.error('❌ Erro ao buscar usuário por ID:', error);
        return null;
      }
      
      console.log('✅ Usuário encontrado:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no getUserById:', error);
      return null;
    }
  }

  // Buscar patriarca da família
  static async getFamilyPatriarch(familyId: string): Promise<FamilyMember | null> {
    try {
      console.log('👑 Buscando patriarca da família:', familyId);
      
      const { data, error } = await supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId)
        .in('role', ['Patriarca', 'Matriarca'])
        .limit(1)
        .maybeSingle();

      if (error) {
        console.error('❌ Erro ao buscar patriarca:', error);
        return null;
      }
      
      console.log('✅ Patriarca encontrado:', data ? 'Sim' : 'Não');
      return data;
    } catch (error) {
      console.error('❌ Erro no getFamilyPatriarch:', error);
      return null;
    }
  }

  // Buscar pais do membro - VERSÃO CORRIGIDA PARA PEGAR APENAS O PAI DIRETO
  static async getMemberParents(memberId: string): Promise<FamilyMember[]> {
    try {
      console.log('👨‍👩‍👧‍👦 Buscando pai direto do membro:', memberId);
      
      // Primeiro buscar o membro para pegar o parent_id
      const member = await this.getMemberById(memberId);
      if (!member) {
        console.log('❌ Membro não encontrado:', memberId);
        return [];
      }

      console.log('👤 Dados do membro:', {
        nome: `${member.first_name} ${member.last_name}`,
        parent_id: member.parent_id,
        family_id: member.family_id
      });

      const parents: FamilyMember[] = [];

      // APENAS buscar o pai/mãe direto através do parent_id
      if (member.parent_id) {
        const directParent = await this.getMemberById(member.parent_id);
        if (directParent) {
          parents.push(directParent);
          console.log('✅ Pai direto encontrado:', `${directParent.first_name} ${directParent.last_name} (${directParent.role})`);
        }
      }

      // Se não tem parent_id, buscar patriarca/matriarca como fallback
      if (parents.length === 0) {
        console.log('⚠️ Sem parent_id definido, buscando patriarca/matriarca...');
        const patriarch = await this.getFamilyPatriarch(member.family_id);
        if (patriarch && patriarch.id !== member.id) {
          parents.push(patriarch);
          console.log('✅ Patriarca/Matriarca encontrado como pai:', `${patriarch.first_name} ${patriarch.last_name} (${patriarch.role})`);
        }
      }

      console.log(`✅ Total de pais encontrados: ${parents.length}`);
      parents.forEach(parent => {
        console.log(`   - ${parent.first_name} ${parent.last_name} (${parent.role})`);
      });

      return parents;
    } catch (error) {
      console.error('❌ Erro no getMemberParents:', error);
      return [];
    }
  }

  // Buscar membros aleatórios para desafio - VERSÃO MELHORADA
  static async getRandomMembersForChallenge(familyId: string, excludeIds: string[] = [], count: number = 4): Promise<FamilyMember[]> {
    try {
      console.log('🎲 Buscando membros aleatórios para desafio');
      console.log('🚫 Excluindo IDs:', excludeIds);
      
      let query = supabase
        .from('family_members')
        .select('*')
        .eq('family_id', familyId);
      
      // Excluir IDs específicos (membro atual e pais)
      if (excludeIds.length > 0) {
        query = query.not('id', 'in', `(${excludeIds.join(',')})`);
      }
      
      const { data, error } = await query;

      if (error) {
        console.error('❌ Erro ao buscar membros aleatórios:', error);
        return [];
      }
      
      if (!data || data.length === 0) {
        console.log('⚠️ Nenhum membro disponível para seleção aleatória');
        return [];
      }
      
      console.log(`📋 Membros disponíveis para seleção: ${data.length}`);
      data.forEach(member => {
        console.log(`   - ${member.first_name} ${member.last_name} (${member.role})`);
      });
      
      // Embaralhar COMPLETAMENTE e pegar apenas a quantidade solicitada
      const shuffled = [...data].sort(() => Math.random() - 0.5);
      const selected = shuffled.slice(0, Math.min(count, data.length));
      
      console.log(`✅ Membros aleatórios selecionados: ${selected.length}`);
      selected.forEach(member => {
        console.log(`   ✓ ${member.first_name} ${member.last_name} (${member.role})`);
      });
      
      return selected;
    } catch (error) {
      console.error('❌ Erro no getRandomMembersForChallenge:', error);
      return [];
    }
  }

  // Desbloquear usuário (apenas admin)
  static async unblockUser(userId: string): Promise<void> {
    try {
      const { error } = await supabase
        .from('system_users')
        .update({ 
          is_blocked: false,
          failed_attempts: 0,
          blocked_at: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) {
        console.error('❌ Erro ao desbloquear usuário:', error);
        throw error;
      }
      
      console.log('✅ Usuário desbloqueado');
    } catch (error) {
      console.error('❌ Erro no unblockUser:', error);
      throw error;
    }
  }

  // Excluir família inteira - NOVA FUNÇÃO
  static async deleteFamily(familyId: string): Promise<void> {
    try {
      console.log('🗑️ Iniciando exclusão da família:', familyId);
      
      // 1. Primeiro, excluir todos os usuários do sistema associados à família
      const { error: usersError } = await supabase
        .from('system_users')
        .delete()
        .eq('family_id', familyId);

      if (usersError) {
        console.error('❌ Erro ao excluir usuários da família:', usersError);
        throw new Error(`Erro ao excluir usuários: ${usersError.message}`);
      }
      
      console.log('✅ Usuários da família excluídos');

      // 2. Depois, excluir todos os membros da família
      const { error: membersError } = await supabase
        .from('family_members')
        .delete()
        .eq('family_id', familyId);

      if (membersError) {
        console.error('❌ Erro ao excluir membros da família:', membersError);
        throw new Error(`Erro ao excluir membros: ${membersError.message}`);
      }
      
      console.log('✅ Membros da família excluídos');

      // 3. Por último, excluir a família
      const { error: familyError } = await supabase
        .from('families')
        .delete()
        .eq('id', familyId);

      if (familyError) {
        console.error('❌ Erro ao excluir família:', familyError);
        throw new Error(`Erro ao excluir família: ${familyError.message}`);
      }
      
      console.log('✅ Família excluída com sucesso');
    } catch (error) {
      console.error('❌ Erro no deleteFamily:', error);
      throw error;
    }
  }

  // Excluir membro específico - NOVA FUNÇÃO
  static async deleteFamilyMember(memberId: string): Promise<void> {
    try {
      console.log('🗑️ Iniciando exclusão do membro:', memberId);
      
      // 1. Primeiro, excluir usuário do sistema se existir
      const { error: userError } = await supabase
        .from('system_users')
        .delete()
        .eq('member_id', memberId);

      if (userError) {
        console.warn('⚠️ Aviso ao excluir usuário do membro:', userError);
        // Não falhar se não houver usuário associado
      }
      
      console.log('✅ Usuário do membro excluído (se existia)');

      // 2. Depois, excluir o membro
      const { error: memberError } = await supabase
        .from('family_members')
        .delete()
        .eq('id', memberId);

      if (memberError) {
        console.error('❌ Erro ao excluir membro:', memberError);
        throw new Error(`Erro ao excluir membro: ${memberError.message}`);
      }
      
      console.log('✅ Membro excluído com sucesso');
    } catch (error) {
      console.error('❌ Erro no deleteFamilyMember:', error);
      throw error;
    }
  }

  // Excluir membro e toda sua descendência - NOVA FUNÇÃO PARA ADMIN
  static async deleteMemberAndDescendants(memberId: string): Promise<{ deletedCount: number; deletedMembers: string[] }> {
    try {
      console.log('🗑️ Iniciando exclusão em cascata do membro:', memberId);
      
      const deletedMembers: string[] = [];
      
      // Função recursiva para encontrar todos os descendentes
      const findAllDescendants = async (parentId: string): Promise<string[]> => {
        const { data: children, error } = await supabase
          .from('family_members')
          .select('id, first_name, last_name')
          .eq('parent_id', parentId);

        if (error) {
          console.error('❌ Erro ao buscar descendentes:', error);
          return [];
        }

        let allDescendants: string[] = [];
        
        if (children && children.length > 0) {
          for (const child of children) {
            console.log(`👶 Encontrado descendente: ${child.first_name} ${child.last_name}`);
            allDescendants.push(child.id);
            
            // Buscar descendentes deste filho recursivamente
            const grandChildren = await findAllDescendants(child.id);
            allDescendants = allDescendants.concat(grandChildren);
          }
        }
        
        return allDescendants;
      };

      // Buscar todos os descendentes do membro
      const descendants = await findAllDescendants(memberId);
      console.log(`📋 Total de descendentes encontrados: ${descendants.length}`);
      
      // Lista completa para exclusão (membro + descendentes)
      const allToDelete = [memberId, ...descendants];
      deletedMembers.push(...allToDelete);
      
      // Excluir todos os usuários do sistema associados
      if (allToDelete.length > 0) {
        const { error: usersError } = await supabase
          .from('system_users')
          .delete()
          .in('member_id', allToDelete);

        if (usersError) {
          console.warn('⚠️ Aviso ao excluir usuários dos membros:', usersError);
        }
        
        console.log('✅ Usuários dos membros excluídos');
      }

      // Excluir todos os membros (em ordem reversa para evitar conflitos de FK)
      for (let i = allToDelete.length - 1; i >= 0; i--) {
        const memberToDelete = allToDelete[i];
        
        const { error: memberError } = await supabase
          .from('family_members')
          .delete()
          .eq('id', memberToDelete);

        if (memberError) {
          console.error(`❌ Erro ao excluir membro ${memberToDelete}:`, memberError);
          // Continuar com os outros mesmo se um falhar
        } else {
          console.log(`✅ Membro ${memberToDelete} excluído`);
        }
      }
      
      console.log(`✅ Exclusão em cascata concluída. Total excluído: ${allToDelete.length}`);
      
      return {
        deletedCount: allToDelete.length,
        deletedMembers: allToDelete
      };
    } catch (error) {
      console.error('❌ Erro no deleteMemberAndDescendants:', error);
      throw error;
    }
  }

  // Buscar todos os descendentes de um membro - NOVA FUNÇÃO AUXILIAR
  static async getMemberDescendants(memberId: string): Promise<FamilyMember[]> {
    try {
      console.log('👶 Buscando descendentes do membro:', memberId);
      
      const findAllDescendants = async (parentId: string): Promise<FamilyMember[]> => {
        const { data: children, error } = await supabase
          .from('family_members')
          .select('*')
          .eq('parent_id', parentId);

        if (error) {
          console.error('❌ Erro ao buscar descendentes:', error);
          return [];
        }

        let allDescendants: FamilyMember[] = [];
        
        if (children && children.length > 0) {
          allDescendants = [...children];
          
          // Buscar descendentes de cada filho recursivamente
          for (const child of children) {
            const grandChildren = await findAllDescendants(child.id);
            allDescendants = allDescendants.concat(grandChildren);
          }
        }
        
        return allDescendants;
      };

      const descendants = await findAllDescendants(memberId);
      console.log(`✅ Total de descendentes encontrados: ${descendants.length}`);
      
      return descendants;
    } catch (error) {
      console.error('❌ Erro no getMemberDescendants:', error);
      return [];
    }
  }

  // Alterar parentesco de um membro - NOVA FUNÇÃO PARA ADMIN
  static async changeMemberParent(memberId: string, newParentId: string | null): Promise<FamilyMember | null> {
    try {
      console.log('🔄 Alterando parentesco do membro:', { memberId, newParentId });
      
      // Verificar se o novo pai não é um descendente do membro atual (evitar loops)
      if (newParentId) {
        const descendants = await this.getMemberDescendants(memberId);
        const isDescendant = descendants.some(desc => desc.id === newParentId);
        
        if (isDescendant) {
          throw new Error('Não é possível definir um descendente como pai. Isso criaria um loop na hierarquia familiar.');
        }
      }
      
      const updateData: any = {
        parent_id: newParentId,
        updated_at: new Date().toISOString()
      };
      
      const { data, error } = await supabase
        .from('family_members')
        .update(updateData)
        .eq('id', memberId)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro ao alterar parentesco:', error);
        throw new Error(`Erro ao alterar parentesco: ${error.message}`);
      }
      
      console.log('✅ Parentesco alterado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no changeMemberParent:', error);
      throw error;
    }
  }

  // Buscar membros que podem ser pais (excluindo descendentes) - NOVA FUNÇÃO AUXILIAR
  static async getPotentialParents(familyId: string, currentMemberId: string): Promise<FamilyMember[]> {
    try {
      console.log('👨‍👩‍👧‍👦 Buscando potenciais pais para o membro:', currentMemberId);
      
      // Buscar todos os membros da família
      const allMembers = await this.getFamilyMembers(familyId);
      
      // Buscar descendentes do membro atual
      const descendants = await this.getMemberDescendants(currentMemberId);
      const descendantIds = descendants.map(d => d.id);
      
      // Filtrar membros que podem ser pais (excluir o próprio membro e seus descendentes)
      const potentialParents = allMembers.filter(member => 
        member.id !== currentMemberId && 
        !descendantIds.includes(member.id)
      );
      
      console.log(`✅ Potenciais pais encontrados: ${potentialParents.length}`);
      return potentialParents;
    } catch (error) {
      console.error('❌ Erro no getPotentialParents:', error);
      return [];
    }
  }

  // Contar membros de uma família - NOVA FUNÇÃO
  static async getFamilyMemberCount(familyId: string): Promise<number> {
    try {
      const { count, error } = await supabase
        .from('family_members')
        .select('*', { count: 'exact', head: true })
        .eq('family_id', familyId);

      if (error) {
        console.error('❌ Erro ao contar membros:', error);
        return 0;
      }

      return count || 0;
    } catch (error) {
      console.error('❌ Erro no getFamilyMemberCount:', error);
      return 0;
    }
  }

  // Criar usuário do sistema - versão corrigida
  static async createSystemUser(user: Omit<SystemUser, 'id' | 'created_at' | 'updated_at'>): Promise<SystemUser | null> {
    try {
      console.log('👤 Criando usuário do sistema:', user);
      
      const { data, error } = await supabase
        .from('system_users')
        .insert(user)
        .select()
        .single();

      if (error) {
        console.error('❌ Erro detalhado ao criar usuário:', error);
        throw new Error(`Erro ao criar usuário: ${error.message}`);
      }
      
      console.log('✅ Usuário criado com sucesso:', data);
      return data;
    } catch (error) {
      console.error('❌ Erro no createSystemUser:', error);
      throw error;
    }
  }

  // Buscar estatísticas gerais - versão corrigida
  static async getStatistics() {
    try {
      console.log('📊 Buscando estatísticas...');
      
      const [familiesResult, membersResult] = await Promise.allSettled([
        supabase.from('families').select('id', { count: 'exact', head: true }),
        supabase.from('family_members').select('id', { count: 'exact', head: true })
      ]);

      let totalFamilies = 0;
      let totalMembers = 0;

      if (familiesResult.status === 'fulfilled' && !familiesResult.value.error) {
        totalFamilies = familiesResult.value.count || 0;
      } else {
        console.warn('⚠️ Erro ao contar famílias:', familiesResult);
      }

      if (membersResult.status === 'fulfilled' && !membersResult.value.error) {
        totalMembers = membersResult.value.count || 0;
      } else {
        console.warn('⚠️ Erro ao contar membros:', membersResult);
      }

      const stats = { totalFamilies, totalMembers };
      console.log('✅ Estatísticas carregadas:', stats);
      return stats;
    } catch (error) {
      console.warn('⚠️ Erro no getStatistics:', error);
      return { totalFamilies: 0, totalMembers: 0 };
    }
  }

  // Migrar dados do localStorage para Supabase - versão melhorada
  static async migrateFromLocalStorage(): Promise<void> {
    const storedFamilies = localStorage.getItem('familiesData');
    if (!storedFamilies) {
      console.log('📭 Nenhum dado para migrar');
      return;
    }

    try {
      console.log('🔄 Iniciando migração...');
      const familiesData = JSON.parse(storedFamilies);
      
      for (const familyData of familiesData) {
        try {
          console.log('🏠 Migrando família:', familyData.name);
          
          // Criar família
          const family = await this.createFamily(familyData.name);
          
          // Adicionar membros
          if (familyData.membersData && familyData.membersData.length > 0) {
            for (const memberData of familyData.membersData) {
              try {
                console.log('👤 Migrando membro:', memberData.firstName, memberData.lastName);
                
                await this.addFamilyMember({
                  family_id: family.id,
                  first_name: memberData.firstName,
                  last_name: memberData.lastName,
                  birth_date: memberData.birthDate || null,
                  gender: memberData.gender || null,
                  email: memberData.email || null,
                  phone: memberData.phone || null,
                  address: memberData.address || null,
                  photo_url: memberData.photo || null,
                  role: memberData.role || 'Membro da família',
                  parent_id: memberData.parentId || null
                });
              } catch (memberError) {
                console.error(`❌ Erro ao migrar membro ${memberData.firstName}:`, memberError);
              }
            }
          }
        } catch (familyError) {
          console.error(`❌ Erro ao migrar família ${familyData.name}:`, familyError);
        }
      }

      // Limpar localStorage após migração
      localStorage.removeItem('familiesData');
      console.log('✅ Migração concluída com sucesso!');
    } catch (error) {
      console.error('❌ Erro na migração:', error);
      throw new Error(`Erro na migração: ${error instanceof Error ? error.message : 'Erro desconhecido'}`);
    }
  }
}
