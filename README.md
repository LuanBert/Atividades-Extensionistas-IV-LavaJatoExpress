Infraestrutura Cloud - Lavajato Express
Este documento descreve a arquitetura e configuração da infraestrutura cloud utilizada no projeto Lavajato Express, um sistema completo de gerenciamento de agendamentos para lavagem de veículos.

Visão Geral da Arquitetura
O Lavajato Express foi desenvolvido seguindo uma arquitetura moderna de aplicação web full-stack, utilizando serviços cloud gerenciados para garantir escalabilidade, disponibilidade e facilidade de manutenção. A aplicação é composta por três camadas principais que trabalham de forma integrada para oferecer uma experiência completa aos usuários.

A camada de apresentação consiste em uma aplicação React 19 com TypeScript, utilizando Vite como bundler para otimização de assets e hot-reload durante desenvolvimento. O frontend é servido como aplicação de página única (SPA) com roteamento client-side através do Wouter, proporcionando navegação fluida sem recarregamento de página. A interface foi desenvolvida com Tailwind CSS 4 para estilização responsiva e componentes shadcn/ui baseados em Radix UI para garantir acessibilidade e consistência visual.

A camada de aplicação utiliza Node.js 18+ com Express 4 como servidor web, implementando APIs type-safe através do tRPC 11. Esta abordagem elimina a necessidade de documentação manual de APIs, pois os tipos TypeScript são compartilhados automaticamente entre frontend e backend. O servidor gerencia autenticação via OAuth, processamento de requisições, validação de dados com Zod, e comunicação com banco de dados através do Drizzle ORM.

A camada de dados é baseada em banco de dados relacional MySQL 8.0+ ou TiDB compatível, armazenando informações de usuários, veículos, agendamentos e notificações. O schema é gerenciado através de migrações versionadas do Drizzle ORM, garantindo consistência entre ambientes de desenvolvimento, homologação e produção.

Componentes da Infraestrutura
Servidor de Aplicação
O servidor de aplicação é responsável por executar o backend Node.js e servir os assets do frontend compilado. A configuração recomendada para ambientes de produção inclui instância com no mínimo 2 vCPUs e 4GB de RAM para suportar carga moderada, sistema operacional Linux (Ubuntu 22.04 LTS ou superior) para compatibilidade e segurança, Node.js versão 18 LTS ou superior instalado via nvm para facilitar atualizações, e gerenciador de processos PM2 para garantir disponibilidade contínua e restart automático em caso de falhas.

O servidor executa o processo Node.js na porta 3000 por padrão, com possibilidade de configuração através da variável de ambiente PORT. O PM2 monitora o processo e realiza restart automático em caso de crashes, mantendo logs de execução para análise de problemas. A aplicação é configurada para iniciar automaticamente após reboot do servidor através de systemd ou script de inicialização do PM2.

Banco de Dados
O banco de dados MySQL ou TiDB armazena todos os dados persistentes da aplicação de forma estruturada e relacional. A configuração recomendada inclui instância gerenciada (RDS, PlanetScale, TiDB Cloud) para facilitar backups e manutenção, no mínimo 2GB de RAM e 20GB de armazenamento SSD para performance adequada, versão MySQL 8.0+ ou TiDB compatível com suporte a transações ACID, e configuração de SSL/TLS obrigatório para conexões seguras.

O banco de dados contém quatro tabelas principais: users (armazena informações de autenticação e perfil dos usuários), vehicles (cadastro de veículos com marca, modelo, placa e características), appointments (agendamentos de serviços com data, horário e status), e notifications (notificações enviadas aos usuários sobre eventos do sistema). Índices são criados automaticamente em chaves estrangeiras e campos frequentemente consultados para otimizar performance de queries.

Armazenamento de Arquivos
O sistema utiliza Amazon S3 ou serviço compatível para armazenamento de arquivos estáticos e uploads de usuários. A configuração inclui bucket privado com acesso controlado via IAM policies, URLs pré-assinadas para acesso temporário a arquivos privados, versionamento habilitado para recuperação de versões anteriores, e lifecycle policies para transição automática de arquivos antigos para classes de armazenamento mais econômicas.

Os arquivos são organizados em prefixos lógicos por tipo e usuário, facilitando gerenciamento e aplicação de políticas de acesso. O sistema utiliza helpers pré-configurados (storagePut e storageGet) que abstraem a complexidade de interação com S3, permitindo upload e download de arquivos com poucas linhas de código.

Serviços Externos Integrados
A aplicação integra diversos serviços externos para oferecer funcionalidades completas aos usuários.

Autenticação OAuth (Manus) - O sistema utiliza o serviço OAuth do Manus para autenticação de usuários, eliminando a necessidade de gerenciar senhas e implementar fluxos complexos de recuperação de conta. O fluxo de autenticação redireciona usuários para o portal OAuth do Manus, onde realizam login com credenciais seguras. Após autenticação bem-sucedida, o sistema recebe um token JWT que é armazenado em cookie HTTP-only e utilizado para validar requisições subsequentes.

API de Clima (Open-Meteo) - A integração com a API Open-Meteo fornece dados meteorológicos em tempo real baseados na geolocalização do usuário. O sistema solicita permissão de geolocalização, obtém coordenadas de latitude e longitude, e consulta a API para obter temperatura atual, umidade relativa, velocidade do vento e condições climáticas gerais. Estas informações auxiliam usuários no planejamento de agendamentos, evitando dias com condições climáticas desfavoráveis.

Serviços Manus Forge - O sistema utiliza serviços da plataforma Manus Forge para funcionalidades avançadas, incluindo geração de imagens via IA quando necessário, processamento de linguagem natural para análise de textos, e sistema de notificações para envio de alertas ao proprietário do sistema. Estes serviços são acessados através de APIs REST com autenticação via Bearer token configurado em variáveis de ambiente.

Configuração de Ambiente
A aplicação utiliza variáveis de ambiente para configuração de conexões e credenciais, seguindo as melhores práticas de segurança ao não incluir informações sensíveis no código-fonte.

Variáveis Essenciais
As variáveis essenciais que devem ser configuradas em todos os ambientes incluem:

DATABASE_URL - String de conexão completa com o banco de dados MySQL/TiDB no formato mysql://usuario:senha@host:porta/database. Esta variável é utilizada pelo Drizzle ORM para estabelecer conexão com o banco de dados e executar queries. Em produção, recomenda-se utilizar usuário com privilégios mínimos necessários e senha forte gerada aleatoriamente.

JWT_SECRET - Chave secreta utilizada para assinar tokens JWT de sessão. Deve ser uma string aleatória longa (mínimo 32 caracteres) gerada de forma segura. Esta chave é crítica para segurança da aplicação, pois tokens assinados com ela concedem acesso autenticado ao sistema. Nunca reutilize a mesma chave entre ambientes de desenvolvimento e produção.

VITE_APP_ID - Identificador único da aplicação no sistema OAuth do Manus. Este ID é utilizado durante o fluxo de autenticação para identificar a aplicação solicitante. Cada ambiente (desenvolvimento, homologação, produção) deve ter seu próprio APP_ID para isolamento de dados e sessões.

OAUTH_SERVER_URL - URL base do servidor OAuth do Manus (geralmente https://api.manus.im). Esta variável permite configurar diferentes servidores OAuth em ambientes de desenvolvimento e produção.

VITE_OAUTH_PORTAL_URL - URL do portal de login OAuth onde usuários são redirecionados para autenticação (geralmente https://portal.manus.im). O prefixo VITE_ indica que esta variável é acessível no código frontend.

Variáveis de Serviços Externos
Para integração com serviços externos, as seguintes variáveis devem ser configuradas:

BUILT_IN_FORGE_API_URL e BUILT_IN_FORGE_API_KEY - URL e chave de autenticação para acesso aos serviços Manus Forge no backend. Estas credenciais permitem que o servidor faça requisições autenticadas para serviços de IA e notificações.

VITE_FRONTEND_FORGE_API_URL e VITE_FRONTEND_FORGE_API_KEY - Credenciais para acesso frontend aos serviços Manus Forge. Algumas funcionalidades podem ser acessadas diretamente do navegador para reduzir latência.

OWNER_OPEN_ID e OWNER_NAME - Identificação do proprietário do sistema, utilizado para conceder privilégios administrativos e enviar notificações operacionais importantes.

Variáveis Opcionais
Variáveis opcionais que podem ser configuradas para funcionalidades adicionais incluem:

VITE_ANALYTICS_ENDPOINT e VITE_ANALYTICS_WEBSITE_ID - Configuração de analytics para rastreamento de uso e métricas de performance. Se não configuradas, o sistema funciona normalmente sem coleta de analytics.

VITE_APP_LOGO - URL de logo personalizado da aplicação. Se não configurado, o sistema utiliza logo padrão.

VITE_APP_TITLE - Título customizado da aplicação exibido no navegador. Padrão: "Lavajato Express".

Fluxo de Deploy
O processo de deploy segue um fluxo estruturado para garantir qualidade e minimizar riscos de problemas em produção.

Ambiente de Desenvolvimento
Durante o desenvolvimento, o sistema é executado localmente com hot-reload habilitado para agilizar ciclos de feedback. Desenvolvedores executam pnpm dev para iniciar servidor de desenvolvimento na porta 3000, com Vite servindo o frontend com hot-reload instantâneo e tsx watch recompilando o backend automaticamente a cada mudança. O banco de dados pode ser local (MySQL via Docker) ou remoto (instância de desenvolvimento compartilhada). Variáveis de ambiente são configuradas em arquivo .env local que não é versionado no Git.

Build para Produção
O processo de build compila e otimiza a aplicação para execução em ambiente de produção. O comando pnpm build executa duas etapas principais: compilação do frontend com Vite (minificação de JavaScript, otimização de CSS, geração de hashes em nomes de arquivos para cache busting, tree-shaking para remover código não utilizado) e compilação do backend com esbuild (bundling de todos os módulos em arquivo único, remoção de código de desenvolvimento, otimização de performance).

Os artefatos de build são gerados nos diretórios client/dist/ (contendo HTML, CSS, JavaScript e assets do frontend) e dist/ (contendo servidor Node.js compilado). Estes diretórios devem ser incluídos no deploy para produção.

Deploy em Servidor
O deploy em servidor de produção segue os seguintes passos:

1. Preparação do Ambiente - Instalar Node.js 18+ LTS, instalar PM2 globalmente (npm install -g pm2), configurar variáveis de ambiente em arquivo .env ou através de secrets do provedor cloud, e garantir que o banco de dados está acessível e configurado.

2. Upload de Arquivos - Transferir artefatos de build (client/dist/ e dist/) para servidor via Git, FTP, rsync ou CI/CD pipeline. Incluir arquivos de configuração (package.json, drizzle.config.ts) e executar pnpm install --prod para instalar apenas dependências de produção.

3. Migrações de Banco de Dados - Executar pnpm db:push para aplicar migrações pendentes. Este comando deve ser executado antes de iniciar a aplicação para garantir que o schema do banco de dados está atualizado.

4. Inicialização da Aplicação - Iniciar aplicação com PM2 usando comando pm2 start dist/index.js --name lavajato-express. Configurar PM2 para restart automático em caso de falhas e inicialização automática após reboot do servidor com pm2 startup e pm2 save.

5. Configuração de Proxy Reverso - Configurar Nginx ou Apache como proxy reverso na porta 80/443, redirecionando tráfego para porta 3000 onde a aplicação Node.js está executando. Habilitar SSL/TLS com certificado Let's Encrypt ou certificado comercial.

Plataformas de Deploy Recomendadas
Para facilitar o processo de deploy e manutenção, recomenda-se utilizar plataformas cloud com suporte nativo a Node.js:

Railway - Plataforma moderna com deploy automático via Git, suporte nativo a Node.js e bancos de dados gerenciados, configuração simples de variáveis de ambiente, e SSL automático com domínios personalizados. Ideal para projetos pequenos e médios com necessidade de escalabilidade.

Render - Oferece deploy automático via GitHub, serviços gerenciados de PostgreSQL/MySQL, SSL gratuito e automático, e plano gratuito generoso para projetos pessoais. Boa opção para startups e MVPs.

Heroku - Plataforma consolidada com ecossistema maduro de add-ons, suporte a múltiplas linguagens e frameworks, integração com GitHub para deploy contínuo, e escalabilidade horizontal simples. Recomendado para projetos empresariais.

DigitalOcean App Platform - Infraestrutura confiável com preços competitivos, deploy via Git ou Docker, bancos de dados gerenciados, e monitoramento integrado. Boa opção para desenvolvedores que querem controle sem complexidade de DevOps.

AWS Elastic Beanstalk - Serviço gerenciado da AWS com suporte a Node.js, integração com outros serviços AWS (RDS, S3, CloudWatch), escalabilidade automática baseada em métricas, e controle granular de configurações. Recomendado para projetos que já utilizam ecossistema AWS.

Segurança
A segurança é prioridade no design da infraestrutura, com múltiplas camadas de proteção implementadas.

Autenticação e Autorização
O sistema implementa autenticação via OAuth com tokens JWT armazenados em cookies HTTP-only, prevenindo acesso via JavaScript e mitigando ataques XSS. Os cookies são configurados com flags secure (transmissão apenas via HTTPS), sameSite: 'strict' (prevenção de CSRF), e httpOnly: true (inacessível via JavaScript).

Todas as rotas protegidas validam o token JWT antes de processar requisições, verificando assinatura, data de expiração e integridade dos dados. O middleware de autenticação injeta informações do usuário no contexto da requisição, permitindo que procedures tRPC acessem dados do usuário autenticado de forma type-safe.

Proteção de Dados
Dados sensíveis são protegidos através de múltiplas camadas. Conexões com banco de dados utilizam SSL/TLS obrigatório para criptografia em trânsito. Senhas e tokens nunca são armazenados em texto plano, utilizando hashing com bcrypt quando necessário. Queries SQL são sempre parametrizadas através do Drizzle ORM, prevenindo SQL injection. Validação de entrada é realizada em todas as requisições usando schemas Zod, rejeitando dados malformados antes de processamento.

Monitoramento e Logs
O sistema mantém logs detalhados de operações para auditoria e troubleshooting. Logs de aplicação incluem requisições HTTP com método, path e status code, erros e exceções com stack traces completos, operações de banco de dados (queries lentas, deadlocks), e eventos de autenticação (login, logout, falhas). Logs são rotacionados automaticamente para evitar consumo excessivo de disco e podem ser enviados para serviços de agregação como CloudWatch, Datadog ou Papertrail.

Escalabilidade
A arquitetura foi projetada para permitir escalabilidade horizontal e vertical conforme demanda cresce.

Escalabilidade Horizontal
Para suportar aumento de tráfego, múltiplas instâncias da aplicação podem ser executadas em paralelo atrás de load balancer. O servidor Node.js é stateless, armazenando sessões em cookies JWT ao invés de memória do servidor. Isto permite que qualquer instância processe qualquer requisição sem necessidade de sticky sessions.

Load balancers como Nginx, HAProxy ou AWS ALB distribuem requisições entre instâncias usando algoritmos round-robin ou least-connections. Health checks periódicos garantem que apenas instâncias saudáveis recebem tráfego. Em caso de falha de uma instância, o load balancer automaticamente redireciona tráfego para instâncias funcionais.

Escalabilidade Vertical
Para melhorar performance de instâncias individuais, recursos de CPU e memória podem ser aumentados conforme necessário. Node.js utiliza event loop single-threaded, mas pode aproveitar múltiplos cores através de cluster mode do PM2. Configurando pm2 start dist/index.js -i max, o PM2 inicia uma instância por core de CPU disponível, maximizando utilização de recursos.

Otimizações de Performance
Diversas otimizações são implementadas para reduzir latência e melhorar throughput. Assets do frontend são servidos com cache agressivo (1 ano) através de headers HTTP, com cache busting via hashes em nomes de arquivos. Compressão gzip/brotli é habilitada para reduzir tamanho de transferência. Queries de banco de dados utilizam índices apropriados e são otimizadas para evitar N+1 queries. Conexões com banco de dados utilizam pooling para reutilizar conexões existentes.

Backup e Recuperação
Estratégias de backup garantem que dados podem ser recuperados em caso de falhas ou corrupção.

Backup de Banco de Dados
Bancos de dados gerenciados (RDS, PlanetScale, TiDB Cloud) oferecem backups automáticos diários com retenção configurável (geralmente 7-30 dias). Snapshots manuais podem ser criados antes de mudanças críticas como migrações de schema ou updates de versão. Backups são armazenados em múltiplas zonas de disponibilidade para proteção contra falhas regionais.

Para bancos de dados auto-gerenciados, scripts de backup devem ser executados diariamente via cron, exportando dump completo com mysqldump e enviando para armazenamento seguro (S3, Google Cloud Storage). Testes de restauração devem ser realizados periodicamente para validar integridade dos backups.

Backup de Arquivos
Arquivos armazenados em S3 são protegidos através de versionamento, permitindo recuperação de versões anteriores em caso de exclusão acidental ou corrupção. Replicação cross-region pode ser configurada para proteção contra falhas regionais. Lifecycle policies movem versões antigas para classes de armazenamento mais econômicas (S3 Glacier) após período configurável.

Plano de Recuperação de Desastres
Em caso de falha catastrófica, o plano de recuperação inclui: provisionar nova instância de servidor em região diferente, restaurar backup mais recente do banco de dados, configurar variáveis de ambiente e credenciais, executar migrações pendentes se necessário, e atualizar DNS para apontar para nova instância. O objetivo de tempo de recuperação (RTO) é de 4 horas, e o objetivo de ponto de recuperação (RPO) é de 24 horas baseado em backups diários.

Monitoramento e Observabilidade
Monitoramento contínuo permite detectar e resolver problemas antes que afetem usuários.

Métricas de Sistema
Métricas de infraestrutura incluem uso de CPU, memória e disco, latência de rede e throughput, taxa de requisições HTTP por segundo e distribuição de status codes, e tempo de resposta médio e percentis (p50, p95, p99). Estas métricas são coletadas por agentes de monitoramento (CloudWatch Agent, Prometheus Node Exporter) e visualizadas em dashboards (Grafana, CloudWatch Dashboards).

Alertas
Alertas são configurados para notificar equipe sobre condições anormais: uso de CPU acima de 80% por mais de 5 minutos, uso de memória acima de 90%, taxa de erro HTTP 5xx acima de 1%, tempo de resposta p95 acima de 2 segundos, e falhas de health check. Notificações são enviadas via email, SMS ou integrações com Slack/Discord.

Logs Centralizados
Logs de todas as instâncias são agregados em sistema centralizado (CloudWatch Logs, Elasticsearch, Loki) para facilitar busca e análise. Logs são estruturados em formato JSON para facilitar parsing e filtragem. Queries comuns são salvas como dashboards para acesso rápido durante troubleshooting.

Custos Estimados
A estimativa de custos mensais para infraestrutura varia conforme escala e provedor cloud escolhido.

Configuração Inicial (Baixo Tráfego)
Para projeto inicial com até 10.000 usuários ativos mensais:

Componente	Especificação	Custo Mensal Estimado
Servidor de Aplicação	2 vCPU, 4GB RAM	$20-40
Banco de Dados	MySQL gerenciado, 2GB RAM	$15-30
Armazenamento S3	10GB + transferência	$5-10
Certificado SSL	Let's Encrypt gratuito	$0
Total		$40-80
Configuração Média (Tráfego Moderado)
Para projeto estabelecido com 50.000-100.000 usuários ativos mensais:

Componente	Especificação	Custo Mensal Estimado
Servidores de Aplicação	2x instâncias (4 vCPU, 8GB RAM cada)	$80-160
Load Balancer	Gerenciado	$20-30
Banco de Dados	MySQL gerenciado, 8GB RAM, réplica read	$100-150
Armazenamento S3	100GB + transferência	$15-25
CDN	CloudFront ou similar	$20-40
Monitoramento	CloudWatch ou Datadog	$30-50
Total		$265-455
Otimização de Custos
Custos podem ser reduzidos através de instâncias reservadas (desconto de 30-50% com compromisso de 1-3 anos), uso de spot instances para workloads tolerantes a interrupções, configuração de auto-scaling para reduzir recursos em horários de baixo tráfego, e utilização de tiers gratuitos de serviços (AWS Free Tier, Railway/Render free plans) durante desenvolvimento.

Considerações Finais
A infraestrutura descrita neste documento foi projetada para oferecer equilíbrio entre simplicidade operacional, escalabilidade e custos. A arquitetura é flexível e pode ser adaptada conforme necessidades específicas do projeto evoluem.

Para projetos em estágio inicial, recomenda-se começar com configuração mínima em plataforma gerenciada (Railway, Render) para reduzir complexidade operacional e focar no desenvolvimento de funcionalidades. Conforme tráfego e requisitos crescem, a infraestrutura pode ser gradualmente migrada para soluções mais robustas com maior controle e customização.

A documentação deve ser mantida atualizada conforme mudanças são realizadas na infraestrutura, garantindo que toda equipe tenha visibilidade sobre arquitetura atual e decisões técnicas tomadas.
