# Nota Fácil Emissor Web

> Plataforma corporativa de emissão e gestão de Notas Fiscais de Serviços Eletrônicas (NFSe) com arquitetura multi-tenancy hierárquica, motor fiscal de retenção de ISS/tributos federais e orquestração assíncrona.

[![Status do Projeto](https://img.shields.io/badge/Status-100%25%20Funcional-success)](./STATUS_PROJETO.md)
[![Testes](https://img.shields.io/badge/Testes-65%20aprovados%20%282.795%20asserções%29-brightgreen)](./STATUS_PROJETO.md)
[![Laravel](https://img.shields.io/badge/Laravel-11-red)](https://laravel.com)
[![Inertia React](https://img.shields.io/badge/Frontend-Inertia%20v2%20%2B%20React%2018-blue)](https://inertiajs.com)

---

## 📌 Documentação & Status Detalhado

Consulte o documento completo com o histórico de todas as especificações implementadas, mapa de telas, regras tributárias e status das entregas:
👉 **[STATUS_PROJETO.md](./STATUS_PROJETO.md)**

---

## 🚀 Stack Tecnológica

- **Backend:** PHP 8.3 + Laravel 11
- **Frontend:** React 18 + Inertia.js v2 + TypeScript + TailwindCSS + Lucide React
- **Banco de Dados:** PostgreSQL 16/17 com escopos de multi-tenancy hierárquico
- **Filas e Jobs:** Redis / Database driver para emissão assíncrona com backoff exponencial
- **Criptografia:** OpenSSL nativo para validação de certificados A1 (`.pfx`) e AES-256 em repouso
- **Ambiente:** WSL 2 Ubuntu Linux

---

## 🛠️ Comandos Principais

```bash
# Rodar migrações do banco de dados
php artisan migrate

# Executar a suíte de testes completa
php artisan test

# Compilar assets frontend (desenvolvimento / produção)
npm run dev
npm run build

# Iniciar servidor local
php artisan serve
```

---

## 🏢 Arquitetura Multi-Tenancy

O sistema adota isolamento de dados em 3 camadas:
1. **Platform Admin:** Acesso global à plataforma e backoffice fiscal.
2. **Escritório Contábil (Office):** Gestão compartilhada de múltiplas empresas clientes.
3. **Empresa (Company):** Emissão de notas, clientes, serviços e certificados restritos ao próprio tenant.
