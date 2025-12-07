<h3>🚀 Infraestrutura Cloud – Lavajato Express </h3>

Resumo da arquitetura e operação do Lavajato Express, hospedado na Manus Cloud.
<hr>

<h3>🏗️ Arquitetura Geral </h3>

Aplicação full-stack em React 19 + Node.js/Express, organizada em monorepo com comunicação tRPC.
Hospedada na Manus Cloud, com deploy simplificado, escalabilidade automática e serviços integrados.
<hr>

<h3>⚙️ Componentes Principais e Servidor de Aplicação</h3>

<ul><li>Containers gerenciados pela Manus Cloud</li>

<li>API + frontend servidos pelo Node.js (porta 3000)</li>

<li>SSL automático, domínio *.manus.space</li>

<li>Monitoramento embutido</li></ul>

<h3>🗄️ Banco de Dados</h3>

<ul><li>MySQL/TiDB gerenciado</li>

<li>Migrações via Drizzle ORM</li>

<li>Backups diários e painel SQL integrado</li></ul>

<h3>📁 Armazenamento</h3>

<ul><li>Serviço S3-compatível integrado</li>

<li>Helpers storagePut / storageGet</li>

<li>Credenciais injetadas automaticamente</li></ul>

<h3>🔐 Autenticação</h3>

<ul><li>Login via Manus OAuth</li>

<li>Tokens JWT armazenados em cookies HttpOnly</li></ul>

<h3>🔌 Serviços Integrados</h3>

<ul><li>Manus Forge API (IA)</li>

<li>Sistema de notificações via notifyOwner()</li>

<li>Analytics automático (page views, sessões, etc.)</li></ul>

<h3>🚀 Deploy</h3>

<ul><li>Deploy feito através de checkpoints versionados</li>

<li>Build automática (Vite + esbuild)</li>

<li>Aplicação de migrações</li>

<li>Blue-green deployment com zero downtime</li>

<li>Rollback instantâneo</li></ul>

<h3>📈 Monitoramento e Logs</h3>

<ul><li>CPU, memória, latência e throughput</li>

<li>Logs stdout/stderr</li>

<li>Analytics de uso</li>

<li>Alertas automáticos de falhas</li></ul>

<h3>🌐 Domínios e SSL</h3>

<ul><li>Domínio padrão *.manus.space</li>

<li>Domínios customizados com SSL via Let’s Encrypt</li></ul>

<h3>🔒 Segurança</h3>

<ul><li>Isolamento de aplicações</li>

<li>SSL obrigatório</li>

<li>Segredos criptografados</li>

<li>OAuth integrado + auditoria de ações</ul>

<h3>📈 Escalabilidade</h3>

<ul><li>Auto-scaling vertical</li>

<li>Balanceamento automático de carga</li>

<li>CDN com cache de assets</li></ul>

<h3>💾 Backup e Recuperação</h3>

<ul><li>Backups diários (retenção de 7 dias)</li>

<li>Checkpoints permanentes</li>

<li>Replicação em múltiplas zonas</li></ul>
