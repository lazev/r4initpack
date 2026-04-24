# Guia Rapido

## Pre-requisitos

- **PHP** acessivel via terminal (adicione ao PATH do sistema)
- **Apache** ou **Nginx** configurado para servir projetos web
- **MariaDB** ou **MySQL** (opcional - necessario se for usar banco de dados)
  - O comando `mysql` tambem precisa estar no PATH

---

## Instalacao do framework

Clone o repositorio na pasta raiz dos projetos do servidor web:

```bash
git clone https://github.com/lazev/r4initpack r4
```

O framework ficara na pasta `r4/` e servira como base para todos os projetos.

---

## Criando seu primeiro projeto

### 1. Criar a pasta do projeto

```bash
mkdir meuProjeto
cd meuProjeto
```

### 2. Inicializar o projeto

```bash
../r4/r4 init
```

O instalador interativo ira perguntar:

1. **Nome do projeto** - Sugestao padrao e o nome da pasta
2. **Usuario do banco** - Usuario do MySQL/MariaDB
3. **Senha do banco** - Senha do banco de dados
4. **Instalar bases modelo** - Cria as tabelas iniciais (users, logs)
5. **Instalar Composer** - Baixa dependencias PHP

**No Linux:** Vai solicitar a senha de root para mover o arquivo de credenciais do banco para `/etc/` (seguranca).

**No Windows:** Sugere mover o arquivo de credenciais para uma pasta segura manualmente.

### 3. Resultado

Apos a instalacao, a estrutura sera:

```
meuProjeto/
  r4.json              Configuracao do compilador
  src/                  Seu codigo-fonte
    _assets/            Recursos do framework e do projeto
      css/
        global/         CSS customizado (incluido automaticamente)
      js/
        global/         JS customizado (incluido automaticamente)
      php/              Classes PHP auxiliares
      templates/        Templates HTML compartilhados
    users/              Modulo de exemplo completo
  public/               Saida compilada (servida pelo servidor web)
  vendor/               Dependencias Composer
    php/
```

---

## Compilando o projeto

### Compilacao unica

```bash
../r4/r4 up
```

### Modo monitor (recomendado para desenvolvimento)

```bash
../r4/r4 up monitor
```

Este comando monitora alteracoes nos arquivos dentro das pastas definidas em `r4.json` e recompila automaticamente quando detecta mudancas.

### O que o compilador faz

1. **Copia** `src/` para `public/`
2. **Copia** os assets do framework (JS, CSS, PHP) para `public/_assets/`
3. **Injeta** templates definidos em `templates.html` nos arquivos HTML
4. **Minifica** e **une** os arquivos JS e CSS
5. **Ofusca** o JavaScript (quando habilitado)
6. **Adiciona** cache busting nos caminhos de arquivos

---

## Criando um modulo

### Via comando

```bash
../r4/r4 initmodule produtos
```

Isso cria a pasta `src/produtos/` com a estrutura completa baseada no modulo `users`:

```
src/produtos/
  produtos.class.php            Backend (modelo)
  produtos.class.js             Frontend (controller)
  fields.json                   Definicao dos campos
  ajax.php                      Endpoint AJAX
  index.html                    Pagina principal
  templates/
    formProdutos.html           Template do formulario
```

### Manualmente

Crie a pasta dentro de `src/` e adicione os arquivos seguindo o padrao:

```
src/meuModulo/
  meuModulo.class.php
  meuModulo.class.js
  fields.json
  ajax.php
  index.html
  templates/
    formMeuModulo.html
```

---

## Estrutura de um modulo

### fields.json

Define os campos do formulario. Usado tanto pelo frontend (Fields.js) quanto pelo backend (ValidFields.php):

```json
[
  {
    "id": "name",
    "type": "text",
    "label": "Nome",
    "required": true,
    "maxSize": 100,
    "placeholder": "Digite o nome"
  },
  {
    "id": "email",
    "type": "email",
    "label": "E-mail",
    "required": true
  },
  {
    "id": "status",
    "type": "select",
    "label": "Status",
    "options": [
      {"value": "1", "label": "Ativo"},
      {"value": "0", "label": "Inativo"}
    ]
  }
]
```

### ajax.php

Endpoint que recebe requisicoes AJAX:

```php
<?php
require '../_assets/php/config.inc.php';

$action = $_REQUEST['action'] ?? '';

switch($action) {
    case 'list':
        $module = new MeuModulo;
        $module->list();
        break;

    case 'save':
        $module = new MeuModulo;
        $module->save();
        break;

    case 'delete':
        $module = new MeuModulo;
        $module->delete();
        break;

    default:
        R4::dieAPI(0, 'Acao invalida');
}

require R4CLASSPATH . 'r4iniend.php';
```

### meuModulo.class.php

Modelo com as operacoes de dados:

```php
<?php
class MeuModulo {

    function list() {
        global $db;
        $rows = $db->select("SELECT * FROM meuModulo ORDER BY name");
        R4::retOkAPI(['list' => $rows]);
    }

    function save() {
        global $db;

        $valid = new ValidFields;
        $valid->addSchema('fields.json');

        if (!$valid->valid($_REQUEST)) {
            R4::dieAPI(0, $valid->errMsg, $valid->errObs, $valid->errFields);
        }

        if (!empty($_REQUEST['id'])) {
            $db->sql("UPDATE meuModulo SET name = :name, email = :email WHERE id = :id", $_REQUEST);
        } else {
            $db->sql("INSERT INTO meuModulo SET name = :name, email = :email", $_REQUEST);
        }

        R4::retOkAPI();
    }
}
```

### meuModulo.class.js

Controller frontend:

```javascript
class MeuModuloClass {

    list() {
        R4.getJSON('ajax.php', { action: 'list' }).then(ret => {
            if (ret.error) return Warning.show(ret.errMsg, ret.errObs);

            let body = [];
            ret.list.forEach(item => {
                Table.initLine();
                Table.addCell(item.name);
                Table.addCell(item.email);
                body.push({ value: item.id, cells: Table.getCells() });
            });

            Table.updateContent($('#tblMeuModulo'), body);
        });
    }

    save() {
        let data = Fields.validateForm($('#formMeuModulo'));
        if (!data) return;

        R4.getJSON('ajax.php', { action: 'save', ...data }).then(ret => {
            if (ret.error) return Fields.setErrFields(ret);
            Warning.show('Salvo com sucesso!');
            Dialog.close($('#dlgMeuModulo'));
            this.list();
        });
    }
}

var MeuModulo = new MeuModuloClass;
```

---

## Configuracao (config.inc.php)

O arquivo `src/_assets/php/config.inc.php` e o ponto central de configuracao:

```php
// Identidade do sistema
define('SYSTEMID', 'meuProjeto');
define('SYSTEMNAME', 'Meu Projeto');

// Caminhos
define('BASEPATH', '/meuProjeto/public/');
define('R4CLASSPATH', '../../../r4/php/');

// Banco de dados
define('DBHOST', 'localhost');
define('DBNAME', 'meuProjeto');

// Seguranca
define('REQUIRELOGIN', true);
define('REQUIREREFERER', true);

// Ambiente
define('DEV', true);  // true = desenvolvimento, false = producao
```

---

## Proximo passo

Consulte a documentacao completa:

- [Arquitetura](arquitetura.md) - Como o framework funciona internamente
- [Referencia PHP](php-referencia.md) - Todos os metodos PHP disponiveis
- [Referencia JavaScript](js-referencia.md) - Todos os metodos JS disponiveis
- [Componentes UI](componentes.md) - Como usar Fields, Table, Dialog, etc.
- [Compilador](compilador.md) - Configuracao do sistema de build
