# Arquitetura do R4

## Visao geral

O R4 e um framework fullstack que conecta backend PHP e frontend JavaScript atraves de um padrao consistente. Nao e um framework MVC tradicional - ele foca em **modulos independentes** que se comunicam via AJAX com respostas JSON padronizadas.

```
                    Navegador
                       |
              index.html + JS classes
                       |
            Fields / Table / Dialog / ...
                       |
                  R4.getJSON()
                       |
                   ajax.php
                       |
              modulo.class.php
                       |
            ValidFields + DB + R4
                       |
                  Banco de dados
```

---

## Principios de design

### 1. Modularidade por funcionalidade

Cada funcionalidade do sistema (usuarios, produtos, vendas) e um modulo isolado com seus proprios arquivos. Nao existe uma pasta `controllers/`, `models/` ou `views/` global - tudo fica junto no modulo.

```
src/
  users/           Modulo completo e autocontido
    users.class.php
    users.class.js
    fields.json
    ajax.php
    index.html
    templates/
  produtos/        Outro modulo completo
    ...
```

### 2. Schema compartilhado

O arquivo `fields.json` e a unica fonte de verdade para os campos de um formulario. Ele e usado:
- No **frontend** pelo `Fields.create()` para gerar os campos HTML
- No **backend** pelo `ValidFields.valid()` para validar os dados recebidos

Isso elimina duplicacao e garante que frontend e backend validem as mesmas regras.

### 3. Convencao sobre configuracao

O framework segue convencoes de nomenclatura:
- `modulo.class.php` e `modulo.class.js` - Mesmo nome, mesma funcionalidade
- `ajax.php` - Sempre o endpoint AJAX do modulo
- `fields.json` - Sempre a definicao dos campos
- `templates/` - Sempre os templates HTML do modulo

### 4. Zero dependencias no frontend

O JavaScript do R4 e vanilla puro. O seletor `$()` e os metodos utilitarios substituem a necessidade de jQuery ou similares, mantendo o bundle leve.

---

## Fluxo de dados

### Requisicao tipica (CRUD)

```
1. Usuario interage com formulario
                |
2. Fields.validateForm() valida no frontend
                |
3. R4.getJSON('ajax.php', dados) envia via POST
                |
4. ajax.php roteia pela 'action'
                |
5. modulo.class.php processa:
   a. ValidFields valida no backend
   b. DB executa a query
   c. R4::retOkAPI() ou R4::dieAPI()
                |
6. Promise resolve no JS
                |
7. Sucesso: Table.updateContent() / Dialog.close()
   Erro: Fields.setErrFields() / Warning.show()
```

### Resposta padrao da API

**Sucesso:**
```json
{"ok": 1, "list": [...], "id": 5}
```

**Erro:**
```json
{
  "error": 1,
  "status": "0",
  "errMsg": "Campos invalidos",
  "errObs": "Corrija os campos destacados",
  "errFields": {"name": "Campo obrigatorio", "email": "E-mail invalido"}
}
```

O frontend trata automaticamente `errFields` - o metodo `Fields.setErrFields()` destaca cada campo com erro e exibe a mensagem correspondente.

---

## Sistema de build

### Fluxo de compilacao

```
src/ (codigo-fonte)
        |
   compiler.php
        |
   +----+----+----+
   |         |         |
 copiar   templater  packer
   |         |         |
   v         v         v
 copia    injeta     minifica
 arquivos templates  JS/CSS
   |         |         |
   +----+----+----+
        |
    public/ (saida)
```

### Etapas detalhadas

1. **Copia** - Todos os arquivos de `src/` sao copiados para `public/`
2. **Assets do framework** - JS, CSS e PHP do R4 sao copiados para `public/_assets/`
3. **Templater** - Substitui marcadores `<!--R4TEMPLATE-nome-->` pelo conteudo definido em `templates.html`
4. **Packer** - Minifica e une arquivos JS/CSS conforme configuracao do `r4.json`
5. **Cache busting** - Marcadores `R4Cache::arquivo` sao substituidos por `arquivo?timestamp`
6. **Concat** - Arquivos definidos em `concatFiles` sao unidos

### Pasta global/

Arquivos colocados em `src/_assets/css/global/` e `src/_assets/js/global/` sao automaticamente concatenados com os arquivos do framework na compilacao. Nao precisam ser incluidos manualmente no HTML.

---

## Camada de seguranca

### Frontend

- `REQUIREREFERER` - Valida que requisicoes AJAX vem do proprio dominio
- `freeway.js.php` - Carrega configuracoes sem autenticacao
- `gatekeeper.js.php` - Carrega configuracoes com verificacao de sessao

### Backend

- `r4iniend.php` - Bootstrap que verifica login e referer antes de processar
- `ValidFields` - Validacao de entrada com tipos e regras
- `DB.sql()` - Binding automatico de parametros (previne SQL injection)
- `Security` - Geracao e validacao de chaves criptograficas
- `R4::recursiveTagSymbolsReplace()` - Escape de caracteres HTML nas respostas

### Sessoes

Todas as variaveis de sessao sao armazenadas dentro de um namespace `$_SESSION[SYSTEMID]`, evitando conflitos entre projetos no mesmo servidor.

---

## Banco de dados

### Classe DB

A classe `DB` encapsula `mysqli` com:

- **Binding automatico** - Parametros `:nome` sao substituidos de forma segura
- **Deteccao de tipo** - Identifica automaticamente SELECT, INSERT, UPDATE, DELETE
- **Debug** - Modo debug exibe queries executadas ou salva em log
- **Tratamento de erro** - Em dev mostra detalhes, em producao mostra mensagem generica

### Exemplo de uso

```php
// SELECT simples
$users = $db->select("SELECT * FROM users WHERE active = :active", ['active' => 1]);

// INSERT com binding automatico
$db->sql("INSERT INTO users SET name = :name, email = :email", $_REQUEST);
$newId = $db->getInsertId();

// UPDATE
$db->sql("UPDATE users SET name = :name WHERE id = :id", $_REQUEST);

// Paginacao
$limit = $db->getLimit($page, $regPerPage);
$users = $db->select("SELECT * FROM users $limit");
```

---

## Templates

### Templates globais

Definidos em `src/_assets/templates/templates.html`:

```html
<!--R4TEMPLATE-head-->
<meta charset="utf-8">
<meta http-equiv="Content-Language" content="pt-br">
<link rel="stylesheet" href="...">
<!--/R4TEMPLATE-->

<!--R4TEMPLATE-scripts-->
<script src="..."></script>
<!--/R4TEMPLATE-->
```

Nos arquivos HTML, basta incluir o marcador:

```html
<head>
    <!--R4TEMPLATE-head-->
</head>
```

O compilador substitui o marcador pelo bloco completo.

### Templates de modulo

Templates dentro de `src/modulo/templates/` sao automaticamente injetados no `index.html` do respectivo modulo.

### Cache busting

Use o marcador `R4Cache::` para adicionar timestamp automatico:

```html
<link rel="stylesheet" href="R4Cache::css/estilo.css">
<!-- compila para: -->
<link rel="stylesheet" href="css/estilo.css?1713350400">
```

---

## Logs

O sistema de logs grava em `/var/log/r4/SYSTEMID/`:

```
2024-01-15 14:30:22|users|45|INFO|Usuario logado com sucesso
2024-01-15 14:31:05|users|45|ERROR|Tentativa de acesso negada
```

Formato: `data|modulo|idModulo|tipo|mensagem`

O painel de debug (`php/debug.php`) permite visualizar e filtrar os logs em uma interface HTML.

---

## Diagrama de componentes

```
+--------------------------------------------------+
|                    FRONTEND                       |
|                                                   |
|  $() -----> R4 (core, ajax, utils)               |
|              |                                    |
|  Fields <----+----> Table                         |
|  Dialog <----+----> Tabs                          |
|  Warning <---+----> Pop                           |
|  Sbar <------+----> Effects                       |
|              |                                    |
|         R4.getJSON()                              |
+-------------|-------------------------------------+
              | HTTP POST/GET
+-------------|-------------------------------------+
|                    BACKEND                        |
|              |                                    |
|          ajax.php                                 |
|              |                                    |
|    r4iniend.php (bootstrap)                       |
|              |                                    |
|  R4 <--------+----> DB                            |
|  ValidFields +----> Security                      |
|  Logger <----+                                    |
|              |                                    |
|         MySQL/MariaDB                             |
+--------------------------------------------------+
```
