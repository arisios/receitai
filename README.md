# 🍳 ReceitAI - Aplicativo Culinário com Inteligência Artificial

![Next.js](https://img.shields.io/badge/Next.js-15-black)
![React](https://img.shields.io/badge/React-19-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-v4-38bdf8)
![OpenAI](https://img.shields.io/badge/OpenAI-GPT--4o-412991)

**ReceitAI** é um aplicativo web inovador que utiliza visão computacional e IA generativa para transformar fotos de ingredientes em receitas deliciosas e personalizadas.

## ✨ Funcionalidades

- 📸 **Reconhecimento Visual de Ingredientes** - Tire uma foto e a IA identifica automaticamente
- 🤖 **Geração Inteligente de Receitas** - 4 receitas personalizadas baseadas nos seus ingredientes
- 📊 **Informações Nutricionais Completas** - Calorias, proteínas, carboidratos e gorduras
- 🎥 **Vídeos Tutoriais** - Links diretos para vídeos no YouTube
- 🔍 **Filtros Personalizados** - Vegetariano, vegano, sem glúten, sem lactose, low carb
- 📱 **Design Responsivo** - Interface mobile-first inspirada em iFood e Uber Eats
- ⚡ **Performance Otimizada** - Next.js 15 com App Router e Tailwind CSS v4

## 🚀 Demonstração

### Fluxo do Usuário

1. **Upload de Imagem** - Tire uma foto dos ingredientes disponíveis
2. **Análise por IA** - Sistema detecta automaticamente os ingredientes
3. **Receitas Geradas** - Receba 4 sugestões personalizadas com:
   - Nome e descrição
   - Tempo de preparo
   - Calorias e informações nutricionais
   - Lista de ingredientes
   - Instruções passo a passo
   - Vídeo tutorial no YouTube

## 🛠️ Tecnologias

### Frontend
- **Next.js 15** - Framework React com App Router
- **React 19** - Biblioteca UI
- **TypeScript 5** - Tipagem estática
- **Tailwind CSS v4** - Estilização moderna
- **Shadcn/ui** - Componentes UI acessíveis
- **Lucide React** - Ícones minimalistas

### Backend / APIs
- **OpenAI GPT-4o** - Análise de imagens e geração de receitas
- **YouTube Data API** - Busca de vídeos tutoriais
- **Next.js API Routes** - Serverless functions

### Opcionais
- **Google Cloud Vision** - Alternativa para detecção de ingredientes
- **AWS Rekognition** - Outra alternativa de visão computacional
- **Nutritionix API** - Informações nutricionais detalhadas
- **Spoonacular API** - Base de dados de receitas
- **Supabase** - Banco de dados e storage
- **Upstash Redis** - Cache para otimização de custos

## 📦 Instalação

### Pré-requisitos
- Node.js 18+ 
- npm ou yarn
- Conta OpenAI com API key

### Passo a Passo

1. **Clone o repositório**
```bash
git clone https://github.com/seu-usuario/receitai.git
cd receitai
```

2. **Instale as dependências**
```bash
npm install
```

3. **Configure as variáveis de ambiente**
```bash
cp .env.example .env.local
```

Edite `.env.local` e adicione suas chaves de API:
```env
# OBRIGATÓRIO
OPENAI_API_KEY=sk-proj-...

# OPCIONAL (mas recomendado)
YOUTUBE_API_KEY=AIza...
```

4. **Execute o servidor de desenvolvimento**
```bash
npm run dev
```

5. **Abra no navegador**
```
http://localhost:3000
```

## 🔑 Obtendo API Keys

### OpenAI (Obrigatório)
1. Acesse [platform.openai.com](https://platform.openai.com/)
2. Crie uma conta ou faça login
3. Vá em **API Keys** no menu
4. Clique em **Create new secret key**
5. Copie a chave e adicione no `.env.local`

**Custo estimado**: ~$0.01-0.05 por análise (modelo gpt-4o)

### YouTube API (Opcional)
1. Acesse [Google Cloud Console](https://console.cloud.google.com/)
2. Crie um novo projeto
3. Ative a **YouTube Data API v3**
4. Crie credenciais (API Key)
5. Copie a chave e adicione no `.env.local`

**Limite gratuito**: 10.000 requisições/dia

## 📊 Arquitetura

```
┌─────────────────────────────────────────────┐
│           FRONTEND (Next.js 15)             │
│  Upload → Análise IA → Exibição Receitas   │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│        API ROUTES (Serverless)              │
│  /api/analyze-image                         │
│  /api/generate-recipes                      │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│         SERVIÇOS EXTERNOS                   │
│  • OpenAI GPT-4o Vision                     │
│  • OpenAI GPT-4o (Receitas)                 │
│  • YouTube Data API                         │
└─────────────────────────────────────────────┘
```

## 📁 Estrutura do Projeto

```
receitai/
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   ├── analyze-image/
│   │   │   │   └── route.ts          # Análise de imagem
│   │   │   └── generate-recipes/
│   │   │       └── route.ts          # Geração de receitas
│   │   ├── layout.tsx                # Layout principal
│   │   ├── page.tsx                  # Página inicial
│   │   └── globals.css               # Estilos globais
│   ├── components/
│   │   └── ui/                       # Componentes Shadcn/ui
│   └── lib/
│       └── utils.ts                  # Utilitários
├── public/                           # Assets estáticos
├── .env.example                      # Exemplo de variáveis
├── DOCUMENTACAO_TECNICA.md          # Documentação completa
├── package.json
└── README.md
```

## 🎨 Design

### Paleta de Cores
- **Primária**: Gradiente laranja (#f97316) → vermelho (#dc2626)
- **Neutra**: Cinza 50-900
- **Acentos**: Azul (proteínas), Amarelo (carboidratos), Verde (gorduras)

### Inspiração
Interface inspirada nos apps líderes de mercado:
- **iFood** - Cards grandes, gradientes vibrantes
- **Uber Eats** - Design limpo, foco em imagens
- **Airbnb** - Espaçamento generoso, tipografia clara

## 📈 Métricas e Qualidade

O sistema implementa monitoramento completo:

- ✅ **Precisão** - Acurácia da detecção de ingredientes
- ✅ **Relevância** - Receitas usam ingredientes detectados
- ✅ **Coerência** - Receitas fazem sentido culinário
- ✅ **Completude** - Todos os campos obrigatórios preenchidos
- ✅ **Fluência** - Texto natural e bem escrito

Veja detalhes completos em [DOCUMENTACAO_TECNICA.md](./DOCUMENTACAO_TECNICA.md)

## 🚧 Roadmap

### ✅ Fase 1 - MVP (Concluído)
- [x] Upload de imagem
- [x] Detecção de ingredientes com IA
- [x] Geração de receitas
- [x] Interface responsiva
- [x] Busca de vídeos

### 🔄 Fase 2 - Melhorias (Em Progresso)
- [ ] Sistema de autenticação
- [ ] Histórico de análises
- [ ] Receitas favoritas
- [ ] Compartilhamento social
- [ ] PWA com offline support

### 📅 Fase 3 - Escala (Planejado)
- [ ] Cache com Redis
- [ ] Ensemble de modelos de IA
- [ ] Dashboard de analytics
- [ ] API pública
- [ ] Apps mobile (React Native)

## 🤝 Contribuindo

Contribuições são bem-vindas! Por favor:

1. Fork o projeto
2. Crie uma branch para sua feature (`git checkout -b feature/MinhaFeature`)
3. Commit suas mudanças (`git commit -m 'Adiciona MinhaFeature'`)
4. Push para a branch (`git push origin feature/MinhaFeature`)
5. Abra um Pull Request

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

## 🙏 Agradecimentos

- [OpenAI](https://openai.com/) - Modelos de IA
- [Vercel](https://vercel.com/) - Hospedagem e deployment
- [Shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Lucide](https://lucide.dev/) - Ícones

## 📞 Contato

- **Website**: [receitai.app](https://receitai.app)
- **Email**: contato@receitai.app
- **Twitter**: [@receitai](https://twitter.com/receitai)

---

**Desenvolvido com ❤️ usando Next.js 15, React 19 e OpenAI GPT-4o**
