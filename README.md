# 🎯 Chamada Inteligente

Sistema de controle de presença integrado ao **Google Sheets**, responsivo e mobile-first.

## ✨ Funcionalidades

- ✅ Leitura dinâmica de colunas (sem hardcode)
- ✅ Salvamento automático de P (Presente) / F (Falta)
- ✅ Suporte a múltiplas turmas (abas da planilha)
- ✅ Adicionar novas datas direto pelo app
- ✅ Busca de alunos em tempo real
- ✅ Interface responsiva (celular, tablet, desktop)
- ✅ Sem login necessário
- ✅ Feedback visual com toasts e animações

## 📋 Pré-requisitos

- **Node.js** 18 ou superior
- **Conta Google** com acesso ao Google Cloud Console
- **Planilha do Google Sheets** no formato:

| Nome Completo | 01/05 | 08/05 | 15/05 |
|--------------|-------|-------|-------|
| João Silva   | P     | F     | P     |
| Maria Santos | P     | P     |       |

---

## 🔧 Configuração do Google Sheets API

### 1. Criar Projeto no Google Cloud Console

1. Acesse [console.cloud.google.com](https://console.cloud.google.com)
2. Clique em **Selecionar projeto** → **Novo Projeto**
3. Nomeie o projeto (ex: `chamada-inteligente`) e crie

### 2. Habilitar a Google Sheets API

1. No menu lateral: **APIs e Serviços** → **Biblioteca**
2. Busque por **Google Sheets API**
3. Clique em **Ativar**

### 3. Criar Service Account

1. Vá em **APIs e Serviços** → **Credenciais**
2. Clique em **Criar Credenciais** → **Conta de serviço**
3. Preencha o nome (ex: `chamada-bot`) e crie
4. Na conta criada, vá na aba **Chaves**
5. Clique em **Adicionar Chave** → **Criar nova chave** → **JSON**
6. Salve o arquivo JSON baixado em local seguro

### 4. Compartilhar a Planilha

1. Abra sua planilha do Google Sheets
2. Clique em **Compartilhar**
3. Cole o **e-mail** da Service Account (campo `client_email` do JSON)
4. Dê permissão de **Editor**

---

## 🚀 Instalação

```bash
# 1. Acesse a pasta do projeto
cd chamada-inteligente

# 2. Instale as dependências
npm install

# 3. Copie o arquivo de configuração
cp .env.example .env

# 4. Edite o .env com seus dados
# Use as informações do JSON da Service Account:
# - GOOGLE_SERVICE_ACCOUNT_EMAIL = client_email
# - GOOGLE_PRIVATE_KEY = private_key
# - SPREADSHEET_ID = ID da sua planilha (na URL)
```

### Encontrar o Spreadsheet ID

Na URL da sua planilha:
```
https://docs.google.com/spreadsheets/d/[ESTE_É_O_ID]/edit
```

---

## ▶️ Executar

```bash
# Desenvolvimento (com auto-reload)
npm run dev

# Produção
npm start
```

Acesse: **http://localhost:3000**

---

## 📁 Estrutura do Projeto

```
chamada-inteligente/
├── server/
│   ├── index.js              # Entry point Express
│   ├── config/
│   │   └── google-sheets.js  # Autenticação Google API
│   ├── routes/
│   │   └── attendance.js     # Rotas REST
│   ├── services/
│   │   └── sheets.service.js # Lógica de negócio
│   └── utils/
│       └── helpers.js        # Funções auxiliares
├── public/
│   ├── index.html            # Página principal
│   ├── css/styles.css        # Estilos (dark theme)
│   └── js/
│       ├── api.js            # Chamadas à API
│       ├── ui.js             # Renderização e DOM
│       └── app.js            # Lógica principal
├── .env                      # Configuração (não commitado)
├── .env.example              # Template de config
└── package.json
```

## 🛠️ Troubleshooting

| Problema | Solução |
|----------|---------|
| "Não foi possível conectar à planilha" | Verifique as variáveis no `.env` |
| "Permission denied" | Compartilhe a planilha com o e-mail da Service Account |
| Chave privada inválida | Copie a chave inteira do JSON, incluindo `\n` |
| Dados não aparecem | Verifique se a primeira linha tem "Nome Completo" e datas |
