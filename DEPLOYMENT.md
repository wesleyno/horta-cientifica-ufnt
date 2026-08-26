# Horta Científica UFNT — implantação e operação

## Estado atual

A aplicação usa React, Vite, Express, tRPC e Drizzle. O banco foi preparado para PostgreSQL no Neon usando `@neondatabase/serverless` e `drizzle-orm/neon-http`. A Vercel publica o frontend compilado em `dist/public` e o backend por meio da função catch-all em `api/[...path].ts`. As fotos ainda dependem de armazenamento S3 por meio de `storagePut` e precisam de um provedor externo compatível quando o projeto sair do ambiente interno; o navegador tem manifest, service worker e fluxo de inscrição Web Push.

## GitHub e Vercel

O código está versionado no checkpoint do projeto e pode ser sincronizado com GitHub pela área de gerenciamento. A configuração efetiva de uma conta GitHub ou de um projeto Vercel exige acesso à conta do proprietário, que não é fornecido automaticamente ao ambiente de desenvolvimento. Por esse motivo, a automação prepara o código e a configuração, mas não cria repositórios, não autoriza OAuth de terceiros e não publica sem a autenticação pontual do proprietário.

Depois de conectar o repositório, o fluxo recomendado é selecionar a pasta raiz do projeto, manter `pnpm install --frozen-lockfile` como instalação e `pnpm build` como build. A configuração `vercel.json` usa `dist/public` como saída do frontend e a pasta `api` para o backend. Cadastre as variáveis abaixo no ambiente de produção. Na infraestrutura gerenciada do projeto, o caminho mais simples é usar o botão **Publish** depois de revisar o checkpoint.

## Variáveis de ambiente

| Variável | Uso | Obrigatória |
|---|---|---:|
| `DATABASE_URL` | Conexão pooled do Neon para runtime | Sim |
| `DATABASE_URL_UNPOOLED` | Conexão direta do Neon para migrations | Sim para migrations |
| `JWT_SECRET` | Assinatura das sessões locais | Sim |
| `BUILT_IN_FORGE_API_URL` | APIs internas para armazenamento e serviços da plataforma | Sim |
| `BUILT_IN_FORGE_API_KEY` | Autorização server-side dessas APIs | Sim |
| `VAPID_PUBLIC_KEY` | Chave pública Web Push no servidor | Sim para push |
| `VAPID_PRIVATE_KEY` | Chave privada Web Push no servidor | Sim para push |
| `VAPID_SUBJECT` | Identidade de contato VAPID | Sim para push |
| `VITE_VAPID_PUBLIC_KEY` | Chave pública exposta ao PWA | Sim para push |
| `RESEND_API_KEY` | Envio de e-mails transacionais | Pendente |

As chaves VAPID do projeto foram geradas automaticamente e não devem ser copiadas para o código-fonte. A chave privada nunca deve ser exposta ao navegador.

## Limites e custos iniciais

A versão inicial foi desenhada para uso escolar pequeno, com poucos workspaces, uploads fotográficos moderados e registros diários. Camadas gratuitas de hospedagem, banco, armazenamento e e-mail podem impor limites de volume, suspensão por inatividade, largura de banda, número de mensagens e retenção. O projeto não deve ser tratado como sistema de produção institucional antes de configurar domínio, monitoramento, política de backup e provedor de e-mail.

## Backup e restauração

O banco deve ser exportado periodicamente por uma rotina administrativa do provedor escolhido, mantendo pelo menos uma cópia fora do ambiente principal. Os arquivos fotográficos devem permanecer no S3; o banco guarda metadados, chaves e permissões. Antes de migrações destrutivas, deve ser feito um dump do banco e uma verificação de restauração em ambiente separado. Exclusões de dados pessoais devem seguir a política aprovada pela instituição.

## Privacidade

CPF e data de nascimento são dados pessoais e devem ser usados somente quando necessários ao projeto, com acesso limitado por papel e workspace. Antes de uso com alunos menores, a coordenação deve confirmar base legal, autorização dos responsáveis, política de retenção, canal de atendimento e procedimentos de exportação e exclusão.

## Evolução para Android e iOS

A PWA pode ser empacotada posteriormente com Capacitor ou solução equivalente. A publicação nas lojas exige contas de desenvolvedor, certificados, ícones, telas de apresentação, política de privacidade pública, configuração de notificações nativas e revisão das políticas da Google Play e da App Store.
