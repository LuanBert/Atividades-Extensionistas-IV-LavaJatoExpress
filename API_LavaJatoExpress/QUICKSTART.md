# Guia Rápido - Lavajato Express API

Este guia irá ajudá-lo a configurar e executar a API do Lavajato Express em poucos minutos.

## Pré-requisitos

- Node.js 18+ instalado
- MySQL 8.0+ ou TiDB
- pnpm (recomendado) ou npm

## Instalação Rápida

### 1. Instalar Dependências

```bash
pnpm install
```

Ou com npm:

```bash
npm install
```

### 2. Configurar Variáveis de Ambiente

Copie o arquivo de exemplo e edite com suas credenciais:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas configurações:

```env
DATABASE_URL=mysql://user:password@localhost:3306/lavajato
JWT_SECRET=seu-secret-aqui
```

### 3. Configurar Banco de Dados

Execute as migrações para criar as tabelas:

```bash
pnpm db:push
```

### 4. Executar a API

Para desenvolvimento:

```bash
pnpm dev
```

A API estará disponível em `http://localhost:3000`

## Testando a API

### Executar Testes

```bash
pnpm test
```

### Testar Endpoints Manualmente

Você pode usar o Postman, Insomnia ou curl para testar os endpoints.

Exemplo com curl para buscar clima:

```bash
curl -X POST http://localhost:3000/api/trpc/weather.getCurrent \
  -H "Content-Type: application/json" \
  -d '{"latitude": -23.5505, "longitude": -46.6333}'
```

## Estrutura do Projeto

```
lavajato-api/
├── server/          # Código do servidor
│   ├── _core/       # Configurações centrais
│   ├── routers.ts   # Definição de endpoints
│   └── db.ts        # Funções de banco de dados
├── drizzle/         # Schema e migrações
└── shared/          # Código compartilhado
```

## Próximos Passos

1. **Leia a documentação completa**: Consulte `README.md` para detalhes sobre todos os endpoints
2. **Integração mobile**: Veja `API_MOBILE.md` para guias de integração React Native e Flutter
3. **Deploy**: Configure sua API em produção (Heroku, Railway, AWS, etc.)

## Comandos Úteis

| Comando | Descrição |
|---------|-----------|
| `pnpm dev` | Inicia servidor de desenvolvimento |
| `pnpm build` | Compila o projeto para produção |
| `pnpm start` | Executa versão de produção |
| `pnpm test` | Executa testes |
| `pnpm db:push` | Aplica migrações do banco |

## Problemas Comuns

### Erro de Conexão com Banco

Verifique se:
- MySQL está rodando
- Credenciais no `.env` estão corretas
- Banco de dados existe

### Porta 3000 já em uso

Altere a porta no arquivo `server/_core/index.ts` ou mate o processo:

```bash
# Linux/Mac
lsof -ti:3000 | xargs kill -9

# Windows
netstat -ano | findstr :3000
taskkill /PID <PID> /F
```

## Suporte

Para mais informações, consulte:
- `README.md` - Documentação completa da API
- `API_MOBILE.md` - Guia de integração mobile
- Issues no GitHub

---

**Pronto!** Sua API está configurada e rodando. 🚀
