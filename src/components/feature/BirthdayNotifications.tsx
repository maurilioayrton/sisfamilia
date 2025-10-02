
import { useState, useEffect } from 'react';

interface BirthdayPerson {
  id: string;
  name: string;
  birthDate: string;
  photo?: string;
  daysUntil: number;
}

interface BirthdayNotificationsProps {
  currentFamily: string;
}

export default function BirthdayNotifications({ currentFamily }: BirthdayNotificationsProps) {
  const [birthdays, setBirthdays] = useState<BirthdayPerson[]>([]);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    loadUpcomingBirthdays();
  }, [currentFamily]);

  const formatDateCorrectly = (dateString: string) => {
    if (!dateString) return '';
    // Criar data sem conversão de fuso horário
    const [year, month, day] = dateString.split('-');
    const date = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    return date.toLocaleDateString('pt-BR', { 
      day: '2-digit', 
      month: 'long' 
    });
  };

  const loadUpcomingBirthdays = () => {
    if (!currentFamily) {
      setBirthdays([]);
      setIsVisible(false);
      return;
    }

    // Carregar membros da família do localStorage
    const storedFamilies = localStorage.getItem('familiesData');
    if (!storedFamilies) {
      setBirthdays([]);
      setIsVisible(false);
      return;
    }

    try {
      const familiesData = JSON.parse(storedFamilies);
      const family = familiesData.find((f: any) => f.id === currentFamily);
      
      if (!family || !family.membersData) {
        setBirthdays([]);
        setIsVisible(false);
        return;
      }

      const members = family.membersData;
      const today = new Date();
      const upcomingBirthdays: BirthdayPerson[] = [];

      members.forEach((member: any) => {
        if (!member.birthDate) return;

        // Criar data sem conversão de fuso horário
        const [year, month, day] = member.birthDate.split('-');
        const birthDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
        const thisYearBirthday = new Date(today.getFullYear(), birthDate.getMonth(), birthDate.getDate());
        
        // Se o aniversário já passou este ano, considerar o próximo ano
        if (thisYearBirthday < today) {
          thisYearBirthday.setFullYear(today.getFullYear() + 1);
        }

        const timeDiff = thisYearBirthday.getTime() - today.getTime();
        const daysUntil = Math.ceil(timeDiff / (1000 * 3600 * 24));

        // Incluir aniversários de hoje até os próximos 5 dias
        if (daysUntil >= 0 && daysUntil <= 5) {
          upcomingBirthdays.push({
            id: member.id,
            name: `${member.firstName} ${member.lastName}`,
            birthDate: member.birthDate,
            daysUntil,
            photo: member.photo || `https://readdy.ai/api/search-image?query=family%20member%20portrait%2C%20friendly%20smile%2C%20professional%20headshot%2C%20warm%20lighting%2C%20simple%20background&width=60&height=60&seq=${member.id}&orientation=squarish`
          });
        }
      });

      // Ordenar por dias até o aniversário
      upcomingBirthdays.sort((a, b) => a.daysUntil - b.daysUntil);
      
      setBirthdays(upcomingBirthdays);
      setIsVisible(upcomingBirthdays.length > 0);
    } catch (error) {
      console.error('Erro ao carregar aniversários:', error);
      setBirthdays([]);
      setIsVisible(false);
    }
  };

  const getBirthdayMessage = (daysUntil: number) => {
    if (daysUntil === 0) return 'Hoje é aniversário!';
    if (daysUntil === 1) return 'Aniversário amanhã';
    return `Aniversário em ${daysUntil} dias`;
  };

  const getBirthdayIcon = (daysUntil: number) => {
    if (daysUntil === 0) return 'ri-cake-3-fill';
    return 'ri-cake-3-line';
  };

  const getBirthdayColor = (daysUntil: number) => {
    if (daysUntil === 0) return 'bg-pink-50 border-pink-200';
    if (daysUntil === 1) return 'bg-purple-50 border-purple-200';
    return 'bg-blue-50 border-blue-200';
  };

  const getTextColor = (daysUntil: number) => {
    if (daysUntil === 0) return 'text-pink-600';
    if (daysUntil === 1) return 'text-purple-600';
    return 'text-blue-600';
  };

  const calculateAge = (birthDate: string) => {
    const today = new Date();
    // Criar data sem conversão de fuso horário
    const [year, month, day] = birthDate.split('-');
    const birth = new Date(parseInt(year), parseInt(month) - 1, parseInt(day));
    let age = today.getFullYear() - birth.getFullYear();
    const monthDiff = today.getMonth() - birth.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birth.getDate())) {
      age--;
    }
    return age + 1; // +1 porque será a idade no aniversário
  };

  if (!isVisible || birthdays.length === 0) {
    return null;
  }

  return (
    <div className="bg-white rounded-lg shadow-md border border-gray-200 p-6 mb-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <i className="ri-cake-3-line text-2xl text-pink-500"></i>
          <h3 className="text-lg font-bold text-gray-800">Aniversariantes</h3>
        </div>
        <button
          onClick={() => setIsVisible(false)}
          className="text-gray-400 hover:text-gray-600 transition-colors"
        >
          <i className="ri-close-line text-xl"></i>
        </button>
      </div>

      <div className="space-y-3">
        {birthdays.map((person) => (
          <div
            key={person.id}
            className={`border rounded-lg p-4 transition-all hover:shadow-sm ${getBirthdayColor(person.daysUntil)}`}
          >
            <div className="flex items-center space-x-4">
              <div className="relative">
                <img
                  src={person.photo}
                  alt={person.name}
                  className="w-12 h-12 rounded-full object-cover object-top"
                />
                {person.daysUntil === 0 && (
                  <div className="absolute -top-1 -right-1 w-6 h-6 bg-pink-500 rounded-full flex items-center justify-center">
                    <i className="ri-cake-3-fill text-white text-xs"></i>
                  </div>
                )}
              </div>
              
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <h4 className="font-medium text-gray-800">{person.name}</h4>
                  {person.daysUntil === 0 && (
                    <span className="bg-pink-100 text-pink-800 text-xs px-2 py-1 rounded-full font-medium">
                      {calculateAge(person.birthDate)} anos
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 mt-1">
                  <i className={`${getBirthdayIcon(person.daysUntil)} ${getTextColor(person.daysUntil)}`}></i>
                  <span className={`text-sm font-medium ${getTextColor(person.daysUntil)}`}>
                    {getBirthdayMessage(person.daysUntil)}
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  {formatDateCorrectly(person.birthDate)}
                </p>
              </div>

              {person.daysUntil === 0 && (
                <div className="text-right">
                  <button className="bg-pink-500 text-white px-3 py-1 rounded-full text-sm hover:bg-pink-600 transition-colors whitespace-nowrap">
                    <i className="ri-gift-line mr-1"></i>
                    Parabenizar
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {birthdays.some(b => b.daysUntil === 0) && (
        <div className="mt-4 p-3 bg-gradient-to-r from-pink-100 to-purple-100 rounded-lg">
          <div className="flex items-center space-x-2">
            <i className="ri-party-popper-line text-pink-600"></i>
            <p className="text-sm text-gray-700">
              <span className="font-medium">Não esqueça!</span> Hoje é um dia especial para nossa família. 
              Que tal enviar uma mensagem de parabéns?
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
