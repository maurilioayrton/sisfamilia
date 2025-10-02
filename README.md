# 🌳 Sistema de Árvore Genealógica

Um sistema moderno e intuitivo para gerenciar e visualizar árvores genealógicas familiares, desenvolvido com React, TypeScript e TailwindCSS.

## ✨ Funcionalidades

- 👥 **Gestão de Membros**: Adicione, edite e gerencie membros da família
- 🌳 **Visualização em Árvore**: Interface visual interativa da árvore genealógica
- 📋 **Modo Lista**: Visualização em grid com scroll infinito
- 🎂 **Notificações de Aniversário**: Alertas automáticos para aniversários do dia e próximos 5 dias
- 📸 **Upload de Fotos**: Suporte a imagens com validação de tamanho (máx. 5MB)
- 🔐 **Sistema de Autenticação**: Login seguro para membros e administradores
- 📱 **Design Responsivo**: Interface adaptável para diferentes dispositivos

## 🚀 Tecnologias Utilizadas

- **Frontend**: React 19, TypeScript, TailwindCSS
- **Roteamento**: React Router DOM
- **Internacionalização**: React i18next
- **Ícones**: Remix Icons, Font Awesome
- **Build Tool**: Vite
- **Estilização**: TailwindCSS

## 📋 Pré-requisitos

- Node.js 18+ 
- npm ou yarn
- Docker e Docker Compose (para ambiente containerizado)

## 🛠️ Instalação e Configuração

### Opção 1: Ambiente Local

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd sistema-arvore-genealogica
```

2. **Instale as dependências**
```bash
npm install
```

3. **Execute o projeto em desenvolvimento**
```bash
npm run dev
```

4. **Acesse a aplicação**
```
http://localhost:3000
```

### Opção 2: Docker (Recomendado)

1. **Clone o repositório**
```bash
git clone <url-do-repositorio>
cd sistema-arvore-genealogica
```

2. **Execute com Docker Compose**
```bash
docker-compose up -d
```

3. **Acesse a aplicação**
```
http://localhost:3000
```

## 🐳 Docker

O projeto inclui configuração completa do Docker para facilitar o desenvolvimento e deploy:

- **Dockerfile**: Configuração otimizada para produção
- **docker-compose.yml**: Orquestração do ambiente completo
- **Nginx**: Servidor web para servir os arquivos estáticos

### Comandos Docker Úteis

```bash
# Subir o ambiente
docker-compose up -d

# Ver logs
docker-compose logs -f

# Parar o ambiente
docker-compose down

# Rebuild da imagem
docker-compose build --no-cache

# Executar comandos no container
docker-compose exec app bash
```

## 📁 Estrutura do Projeto

```
src/
├── components/           # Componentes reutilizáveis
│   ├── base/            # Componentes básicos (botões, inputs, etc.)
│   └── feature/         # Componentes de funcionalidades específicas
├── pages/               # Páginas da aplicação
│   ├── home/           # Página inicial
│   ├── login/          # Página de login
│   ├── dashboard/      # Dashboard principal
│   └── confirm-identity/ # Confirmação de identidade
├── router/             # Configuração de rotas
├── i18n/              # Arquivos de internacionalização
├── hooks/             # Custom hooks
└── mocks/             # Dados de teste
```

## 🎯 Funcionalidades Principais

### Sistema de Autenticação
- Login para membros da família
- Diferentes níveis de acesso (membro/administrador)
- Confirmação de identidade

### Gestão de Membros
- Adicionar novos membros com foto
- Editar informações existentes
- Upload de fotos com validação (máx. 5MB)
- Suporte a formatos: JPG, JPEG, PNG, GIF, WebP

### Visualização da Árvore
- **Modo Árvore**: Visualização hierárquica interativa
- **Modo Lista**: Grid responsivo com scroll infinito
- Carregamento progressivo (6 membros por vez)

### Notificações de Aniversário
- Alertas automáticos para aniversários do dia
- Previsão dos próximos 5 dias
- Interface visual diferenciada por proximidade
- Botão para parabenizar aniversariantes

## 🔧 Scripts Disponíveis

```bash
# Desenvolvimento
npm run dev

# Build para produção
npm run build

# Preview da build
npm run preview
```

## 🌍 Internacionalização

O projeto suporta múltiplos idiomas através do react-i18next:

- Arquivos de tradução em `src/i18n/local/`
- Detecção automática do idioma do navegador
- Fácil adição de novos idiomas

## 📊 Dados de Teste

O sistema inclui dados de exemplo para demonstração:

- **Família Pinheiro**: 10 membros
- **Família Teotônio**: 19 membros
- Aniversários distribuídos para testar notificações

## 🚀 Deploy

### Build para Produção

```bash
npm run build
```

Os arquivos otimizados serão gerados na pasta `out/`.

### Deploy com Docker

```bash
# Build da imagem
docker build -t arvore-genealogica .

# Run do container
docker run -p 3000:80 arvore-genealogica
```

## 🤝 Contribuição

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-funcionalidade`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova funcionalidade'`)
4. Push para a branch (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🆘 Suporte

Para dúvidas ou problemas:

1. Verifique a documentação
2. Consulte as issues existentes
3. Abra uma nova issue com detalhes do problema

## 🔮 Próximas Funcionalidades

- [ ] Integração com banco de dados (Supabase)
- [ ] Sistema de backup automático
- [ ] Exportação da árvore genealógica
- [ ] Compartilhamento de árvores entre famílias
- [ ] Notificações por email
- [ ] Aplicativo móvel

---

Desenvolvido com ❤️ para fortalecer os laços familiares