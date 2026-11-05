# Stack Tecnológica Canônica

## Backend
- **Linguagem:** PHP 8.3+ (tipagem estrita `declare(strict_types=1);`, enums nativos, readonly classes e DTOs)
- **Framework:** Laravel 11.x
- **Arquitetura:** Modular Monolith com Ports & Adapters (Hexagonal para integrações fiscais)
- **Testes:** Pest PHP (Unit & Feature tests)
- **Queues & Cache:** Redis 7+ com Laravel Horizon

## Frontend
- **Camada de Apresentação:** Inertia.js v2 + React 18
- **Estilização:** Tailwind CSS v3
- **Componentes:** Shadcn/ui adaptado para Inertia React (reaproveitando componentes do repositório de origem)
- **Build Tool:** Vite

## Banco de Dados & Infraestrutura
- **RDBMS:** PostgreSQL 15+
- **Storage:** S3 compatível (Cloudflare R2 para PDFs de DANFSE e XMLs de DPS)
- **Gateway Fiscal:** ACBr API Cloud v3.1.9 (NFS-e Padrão Nacional)
