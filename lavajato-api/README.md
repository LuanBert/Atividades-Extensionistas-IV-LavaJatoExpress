# Lavajato Express API

API Backend do sistema Lavajato Express, desenvolvida para integração com aplicativos mobile e web. Esta API fornece endpoints completos para gerenciamento de usuários, veículos, agendamentos de lavagem e notificações, além de integração com serviços meteorológicos.

## Tecnologias Utilizadas

O backend foi construído com tecnologias modernas e robustas para garantir performance, segurança e facilidade de manutenção:

- **Node.js** com TypeScript para type-safety e desenvolvimento eficiente
- **Express** como framework web para gerenciamento de rotas HTTP
- **tRPC** para APIs type-safe com validação automática de tipos
- **Drizzle ORM** para interação com banco de dados MySQL/TiDB
- **Zod** para validação de schemas e dados de entrada
- **Jose** para gerenciamento de tokens JWT e autenticação
- **Vitest** para testes unitários e de integração

## Arquitetura da API

A API segue uma arquitetura modular baseada em tRPC, onde cada funcionalidade é exposta através de procedures organizadas por domínio. Todas as procedures são acessíveis através do endpoint `/api/trpc` e suportam serialização automática com Superjson, permitindo o uso de tipos complexos como Date sem conversões manuais.

### Estrutura de Diretórios

```
lavajato-api/
├── server/
│   ├── _core/           # Configurações centrais (auth, context, tRPC)
│   ├── routers.ts       # Definição de todas as procedures
│   ├── db.ts            # Funções de acesso ao banco de dados
│   └── *.test.ts        # Testes unitários
├── drizzle/
│   ├── schema.ts        # Schema do banco de dados
│   └── migrations/      # Migrações SQL
└── shared/
    └── const.ts         # Constantes compartilhadas
```

## Configuração e Instalação

### Pré-requisitos

Antes de iniciar, certifique-se de ter instalado:

- Node.js versão 18 ou superior
- Banco de dados MySQL 8.0+ ou TiDB compatível
- pnpm (gerenciador de pacotes recomendado)

### Instalação

Clone o repositório e instale as dependências:

```bash
git clone <repository-url>
cd lavajato-api
pnpm install
```

### Configuração de Variáveis de Ambiente

Copie o arquivo `.env.example` para `.env` e configure as variáveis necessárias:

```bash
cp .env.example .env
```

Edite o arquivo `.env` com suas credenciais:

```env
DATABASE_URL=mysql://user:password@host:port/database
JWT_SECRET=your-secret-key-here
VITE_APP_ID=your-app-id
OAUTH_SERVER_URL=https://api.manus.im
```

### Configuração do Banco de Dados

Execute as migrações para criar as tabelas necessárias:

```bash
pnpm db:push
```

Este comando irá gerar e aplicar automaticamente as migrações SQL baseadas no schema definido em `drizzle/schema.ts`.

### Execução

Para desenvolvimento local com hot-reload:

```bash
pnpm dev
```

Para produção:

```bash
pnpm build
pnpm start
```

A API estará disponível em `http://localhost:3000`.

## Endpoints da API

Todos os endpoints estão disponíveis através do endpoint base `/api/trpc` usando o protocolo tRPC. A API é totalmente type-safe e auto-documentada através dos tipos TypeScript.

### Autenticação

#### `auth.me`

Retorna informações do usuário autenticado.

**Tipo:** Query (público)

**Resposta:**
```typescript
{
  id: number;
  openId: string;
  name: string | null;
  email: string | null;
  role: "user" | "admin";
  createdAt: Date;
  lastSignedIn: Date;
} | undefined
```

#### `auth.logout`

Realiza logout do usuário, limpando o cookie de sessão.

**Tipo:** Mutation (público)

**Resposta:**
```typescript
{
  success: true
}
```

### Veículos

Todas as procedures de veículos requerem autenticação.

#### `vehicles.list`

Lista todos os veículos cadastrados pelo usuário autenticado.

**Tipo:** Query (protegido)

**Resposta:**
```typescript
Array<{
  id: number;
  userId: number;
  brand: string;
  model: string;
  plate: string;
  color: string | null;
  year: number | null;
  createdAt: Date;
  updatedAt: Date;
}>
```

#### `vehicles.getById`

Busca um veículo específico por ID.

**Tipo:** Query (protegido)

**Input:**
```typescript
{
  id: number;
}
```

**Resposta:** Objeto do veículo ou erro NOT_FOUND

#### `vehicles.create`

Cria um novo veículo para o usuário autenticado.

**Tipo:** Mutation (protegido)

**Input:**
```typescript
{
  brand: string;        // Obrigatório
  model: string;        // Obrigatório
  plate: string;        // Obrigatório
  color?: string;       // Opcional
  year?: number;        // Opcional
}
```

**Resposta:** Objeto do veículo criado

#### `vehicles.update`

Atualiza informações de um veículo existente.

**Tipo:** Mutation (protegido)

**Input:**
```typescript
{
  id: number;
  brand?: string;
  model?: string;
  plate?: string;
  color?: string;
  year?: number;
}
```

**Resposta:**
```typescript
{
  success: true
}
```

#### `vehicles.delete`

Remove um veículo do sistema.

**Tipo:** Mutation (protegido)

**Input:**
```typescript
{
  id: number;
}
```

**Resposta:**
```typescript
{
  success: true
}
```

### Agendamentos

Todas as procedures de agendamentos requerem autenticação.

#### `appointments.list`

Lista todos os agendamentos do usuário autenticado, ordenados por data.

**Tipo:** Query (protegido)

**Resposta:**
```typescript
Array<{
  id: number;
  userId: number;
  vehicleId: number;
  serviceType: "simple" | "complete";
  appointmentDate: Date;
  status: "pending" | "confirmed" | "completed" | "cancelled";
  createdAt: Date;
  updatedAt: Date;
}>
```

#### `appointments.getById`

Busca um agendamento específico por ID.

**Tipo:** Query (protegido)

**Input:**
```typescript
{
  id: number;
}
```

**Resposta:** Objeto do agendamento ou erro NOT_FOUND

#### `appointments.create`

Cria um novo agendamento de lavagem. Automaticamente cria uma notificação para o usuário.

**Tipo:** Mutation (protegido)

**Input:**
```typescript
{
  vehicleId: number;
  serviceType: "simple" | "complete";
  appointmentDate: Date;
}
```

**Resposta:** Objeto do agendamento criado com status "pending"

**Regras de Negócio:**
- O veículo deve pertencer ao usuário autenticado
- Uma notificação é criada automaticamente após o agendamento

#### `appointments.update`

Atualiza informações de um agendamento existente.

**Tipo:** Mutation (protegido)

**Input:**
```typescript
{
  id: number;
  vehicleId?: number;
  serviceType?: "simple" | "complete";
  appointmentDate?: Date;
  status?: "pending" | "confirmed" | "completed" | "cancelled";
}
```

**Resposta:**
```typescript
{
  success: true
}
```

#### `appointments.delete`

Remove um agendamento do sistema.

**Tipo:** Mutation (protegido)

**Input:**
```typescript
{
  id: number;
}
```

**Resposta:**
```typescript
{
  success: true
}
```

### Notificações

Todas as procedures de notificações requerem autenticação.

#### `notifications.list`

Lista todas as notificações do usuário, ordenadas por data de criação (mais recentes primeiro).

**Tipo:** Query (protegido)

**Resposta:**
```typescript
Array<{
  id: number;
  userId: number;
  title: string;
  message: string;
  type: "appointment" | "system" | "reminder";
  isRead: boolean;
  createdAt: Date;
}>
```

#### `notifications.unreadCount`

Retorna a quantidade de notificações não lidas do usuário.

**Tipo:** Query (protegido)

**Resposta:**
```typescript
number
```

#### `notifications.markAsRead`

Marca uma notificação específica como lida.

**Tipo:** Mutation (protegido)

**Input:**
```typescript
{
  id: number;
}
```

**Resposta:**
```typescript
{
  success: true
}
```

#### `notifications.markAllAsRead`

Marca todas as notificações do usuário como lidas.

**Tipo:** Mutation (protegido)

**Resposta:**
```typescript
{
  success: true
}
```

#### `notifications.delete`

Remove uma notificação do sistema.

**Tipo:** Mutation (protegido)

**Input:**
```typescript
{
  id: number;
}
```

**Resposta:**
```typescript
{
  success: true
}
```

### Clima

#### `weather.getCurrent`

Busca informações meteorológicas atuais usando a API Open-Meteo.

**Tipo:** Query (público)

**Input:**
```typescript
{
  latitude: number;
  longitude: number;
}
```

**Resposta:**
```typescript
{
  current: {
    temperature_2m: number;
    relative_humidity_2m: number;
    weather_code: number;
    wind_speed_10m: number;
  };
  // ... outros campos da API Open-Meteo
}
```

## Schema do Banco de Dados

O sistema utiliza quatro tabelas principais para armazenar os dados:

### Tabela: users

Armazena informações dos usuários autenticados.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT (PK, AUTO_INCREMENT) | Identificador único do usuário |
| openId | VARCHAR(64) UNIQUE | Identificador OAuth (Manus) |
| name | TEXT | Nome do usuário |
| email | VARCHAR(320) | Email do usuário |
| loginMethod | VARCHAR(64) | Método de login utilizado |
| role | ENUM('user', 'admin') | Papel do usuário no sistema |
| createdAt | TIMESTAMP | Data de criação do registro |
| updatedAt | TIMESTAMP | Data da última atualização |
| lastSignedIn | TIMESTAMP | Data do último login |

### Tabela: vehicles

Armazena os veículos cadastrados pelos usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT (PK, AUTO_INCREMENT) | Identificador único do veículo |
| userId | INT | ID do usuário proprietário |
| brand | VARCHAR(100) | Marca do veículo |
| model | VARCHAR(100) | Modelo do veículo |
| plate | VARCHAR(20) | Placa do veículo |
| color | VARCHAR(50) | Cor do veículo (opcional) |
| year | INT | Ano de fabricação (opcional) |
| createdAt | TIMESTAMP | Data de criação do registro |
| updatedAt | TIMESTAMP | Data da última atualização |

### Tabela: appointments

Armazena os agendamentos de lavagem.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT (PK, AUTO_INCREMENT) | Identificador único do agendamento |
| userId | INT | ID do usuário que criou o agendamento |
| vehicleId | INT | ID do veículo a ser lavado |
| serviceType | ENUM('simple', 'complete') | Tipo de serviço solicitado |
| appointmentDate | TIMESTAMP | Data e hora do agendamento |
| status | ENUM('pending', 'confirmed', 'completed', 'cancelled') | Status do agendamento |
| createdAt | TIMESTAMP | Data de criação do registro |
| updatedAt | TIMESTAMP | Data da última atualização |

### Tabela: notifications

Armazena as notificações dos usuários.

| Campo | Tipo | Descrição |
|-------|------|-----------|
| id | INT (PK, AUTO_INCREMENT) | Identificador único da notificação |
| userId | INT | ID do usuário destinatário |
| title | VARCHAR(255) | Título da notificação |
| message | TEXT | Mensagem da notificação |
| type | ENUM('appointment', 'system', 'reminder') | Tipo de notificação |
| isRead | BOOLEAN | Indica se foi lida |
| createdAt | TIMESTAMP | Data de criação |

## Integração com Aplicativos Mobile

Para integrar a API com aplicativos mobile (React Native, Flutter, etc.), recomendamos o uso de clientes tRPC específicos para cada plataforma.

### React Native

Instale o cliente tRPC:

```bash
npm install @trpc/client @trpc/react-query @tanstack/react-query
```

Configure o cliente:

```typescript
import { createTRPCReact } from '@trpc/react-query';
import type { AppRouter } from './path-to-server-types';

export const trpc = createTRPCReact<AppRouter>();

// No seu App.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { httpBatchLink } from '@trpc/client';

const queryClient = new QueryClient();
const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: 'https://your-api-url.com/api/trpc',
    }),
  ],
});

function App() {
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>
        {/* Seu app */}
      </QueryClientProvider>
    </trpc.Provider>
  );
}
```

### Uso dos Endpoints

Exemplo de uso no React Native:

```typescript
// Listar veículos
const { data: vehicles } = trpc.vehicles.list.useQuery();

// Criar agendamento
const createAppointment = trpc.appointments.create.useMutation();

const handleBooking = async () => {
  await createAppointment.mutateAsync({
    vehicleId: 1,
    serviceType: 'complete',
    appointmentDate: new Date('2025-12-15T10:00:00'),
  });
};
```

## Autenticação e Segurança

A API utiliza autenticação baseada em JWT (JSON Web Tokens) através do sistema OAuth do Manus. O fluxo de autenticação funciona da seguinte forma:

1. O usuário é redirecionado para o portal OAuth do Manus
2. Após autenticação bem-sucedida, o callback retorna com um token
3. O token é armazenado em um cookie HTTP-only seguro
4. Todas as requisições subsequentes incluem automaticamente o cookie
5. O middleware de contexto valida o token e injeta o usuário em `ctx.user`

### Procedures Protegidas

Procedures marcadas como `protectedProcedure` requerem autenticação válida. Caso o usuário não esteja autenticado, a API retorna erro `UNAUTHORIZED`.

### Segurança de Dados

- Todos os cookies são configurados com `httpOnly`, `secure` e `sameSite` para prevenir ataques XSS e CSRF
- Senhas e tokens sensíveis nunca são expostos nas respostas da API
- Validação de propriedade: usuários só podem acessar seus próprios recursos (veículos, agendamentos, notificações)

## Testes

O projeto inclui testes unitários para todas as procedures principais.

### Executar Testes

```bash
pnpm test
```

### Estrutura de Testes

Os testes estão organizados por domínio:

- `server/auth.logout.test.ts` - Testes de autenticação
- `server/vehicles.test.ts` - Testes de CRUD de veículos
- `server/appointments.test.ts` - Testes de agendamentos
- `server/notifications.test.ts` - Testes de notificações e clima

### Exemplo de Teste

```typescript
import { describe, expect, it } from "vitest";
import { appRouter } from "./routers";

describe("vehicles procedures", () => {
  it("should create a vehicle", async () => {
    const ctx = createAuthContext();
    const caller = appRouter.createCaller(ctx);

    const vehicle = await caller.vehicles.create({
      brand: "Toyota",
      model: "Corolla",
      plate: "ABC-1234",
    });

    expect(vehicle).toBeDefined();
    expect(vehicle.brand).toBe("Toyota");
  });
});
```

## Tipos de Serviço

O sistema oferece dois tipos de lavagem:

### Lavagem Simples (`simple`)

Serviço básico que inclui:
- Lavagem externa completa
- Secagem
- Limpeza de rodas

### Lavagem Completa (`complete`)

Serviço premium que inclui:
- Lavagem externa e interna completa
- Enceramento
- Polimento
- Aspiração do interior
- Limpeza detalhada de estofados

## Status de Agendamentos

Os agendamentos podem ter os seguintes status:

| Status | Descrição |
|--------|-----------|
| `pending` | Agendamento criado, aguardando confirmação |
| `confirmed` | Agendamento confirmado pelo estabelecimento |
| `completed` | Serviço realizado com sucesso |
| `cancelled` | Agendamento cancelado |

## Códigos de Erro

A API utiliza os códigos de erro padrão do tRPC:

| Código | Descrição |
|--------|-----------|
| `BAD_REQUEST` | Dados de entrada inválidos |
| `UNAUTHORIZED` | Autenticação necessária |
| `FORBIDDEN` | Acesso negado ao recurso |
| `NOT_FOUND` | Recurso não encontrado |
| `INTERNAL_SERVER_ERROR` | Erro interno do servidor |

## Contribuindo

Contribuições são bem-vindas! Para contribuir:

1. Faça um fork do projeto
2. Crie uma branch para sua feature (`git checkout -b feature/nova-feature`)
3. Commit suas mudanças (`git commit -m 'Adiciona nova feature'`)
4. Push para a branch (`git push origin feature/nova-feature`)
5. Abra um Pull Request

## Licença

Este projeto está licenciado sob a licença MIT.

## Suporte

Para questões e suporte, entre em contato através dos issues do GitHub ou pelo email de suporte do projeto.

---

**Desenvolvido para o Lavajato Express** - Sistema completo de gerenciamento de lavagem de veículos.
