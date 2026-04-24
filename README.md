# R4 Framework

Framework fullstack leve e modular para desenvolvimento web com **PHP**, **JavaScript** e **CSS**.

O R4 oferece uma base completa para criar aplicacoes web com formularios inteligentes, tabelas dinamicas, dialogos modais, validacao em dupla camada (frontend + backend), e um sistema de build que minifica, ofusca e injeta templates automaticamente.

---

## Caracteristicas

- **Fullstack** - Classes PHP e JS que trabalham juntas com o mesmo padrao
- **Formularios inteligentes** - Campos tipados com validacao automatica, mascaras e JSON Schema compartilhado
- **Tabelas dinamicas** - Ordenacao, paginacao, selecao multipla e colunas configuraveis
- **Dialogos modais** - Sistema completo com monitoramento de alteracoes e botoes customizaveis
- **Compilador** - Minifica JS/CSS, ofusca codigo, injeta templates e monitora alteracoes em tempo real
- **Modular** - Cada funcionalidade do sistema vive em seu proprio modulo com estrutura padronizada
- **Leve** - Zero dependencias externas no frontend, vanilla JS puro
- **PWA Ready** - Service Worker e manifest incluidos no init pack
- **Validacao brasileira** - CPF, CNPJ, CEP, telefone, moeda (R$) nativos em PHP e JS

---

## Instalacao rapida

### Pre-requisitos

- PHP acessivel via linha de comando
- Apache ou Nginx configurado
- MariaDB ou MySQL (opcional)

### Clonar o framework

Na pasta raiz dos projetos do servidor web:

```bash
git clone https://github.com/lazev/r4initpack r4
```

### Criar um novo projeto

```bash
mkdir meuProjeto
cd meuProjeto
../r4/r4 init
```

O instalador ira perguntar o nome do projeto, credenciais do banco e opcoes de configuracao.

### Compilar

```bash
../r4/r4 up            # compilacao unica
../r4/r4 up monitor    # monitora alteracoes e compila automaticamente
```

### Criar um modulo

```bash
../r4/r4 initmodule produtos
```

---

## Estrutura de um projeto

```
meuProjeto/
  r4.json          Configuracao do compilador
  src/              Codigo-fonte
    _assets/        Arquivos auxiliares (css/, js/, php/, templates/)
    users/          Modulo de exemplo (CRUD completo)
    ...             Seus modulos aqui
  public/           Codigo compilado (gerado automaticamente)
  vendor/           Dependencias do Composer
```

### Estrutura de um modulo

```
src/users/
  users.class.php            Modelo (backend)
  users.class.js             Controller (frontend)
  fields.json                Definicao dos campos do formulario
  ajax.php                   Endpoint AJAX
  index.html                 Pagina principal
  templates/
    formUsers.html           Template do formulario
```

---

## Exemplo rapido

### Definindo campos (fields.json)

```json
[
  {"id": "name",  "type": "text",  "label": "Nome",  "required": true, "maxSize": 100},
  {"id": "email", "type": "email", "label": "E-mail", "required": true},
  {"id": "phone", "type": "phone", "label": "Telefone"},
  {"id": "birth", "type": "date",  "label": "Nascimento"}
]
```

### Criando campos no frontend (JS)

```javascript
Fields.createFromFile('fields.json').then(() => {
    // campos criados no DOM
});
```

### Validando e enviando

```javascript
let data = Fields.validateForm($('#myForm'));
if (data) {
    R4.getJSON('ajax.php', { action: 'save', ...data }).then(ret => {
        if (ret.ok) Warning.show('Salvo com sucesso!');
    });
}
```

### Validando no backend (PHP)

```php
$valid = new ValidFields;
$valid->addSchema('fields.json');

if (!$valid->valid($_REQUEST)) {
    R4::dieAPI(0, $valid->errMsg, $valid->errObs, $valid->errFields);
}

$db->sql("INSERT INTO users SET name = :name, email = :email", $_REQUEST);
R4::retOkAPI();
```

---

## Componentes

| Componente | JS | PHP | CSS | Descricao |
|---|---|---|---|---|
| **R4** | `R4` | `R4` | - | Classe utilitaria principal |
| **Fields** | `Fields` | `ValidFields` | `fields.css` | Formularios e validacao |
| **Table** | `Table` | - | `table.css` | Tabelas dinamicas |
| **Dialog** | `Dialog` | - | `dialog.css` | Dialogos modais |
| **Tabs** | `Tabs` | - | `tabs.css` | Abas |
| **Warning** | `Warning` | - | `warning.css` | Notificacoes toast |
| **Pop** | `Pop` | - | - | Popups e tooltips |
| **Sbar** | `Sbar` | - | - | Sidebar com gestos touch |
| **Effects** | `Effects` | - | - | Animacoes (fade, slide) |
| **DB** | - | `DB` | - | Acesso ao banco de dados |
| **Security** | - | `Security` | - | Chaves criptograficas |
| **Logger** | - | `Logger` | - | Sistema de logs |

---

## Documentacao completa

- **[Guia Rapido](docs/guia-rapido.md)** - Instalacao, primeiro projeto e primeiros passos
- **[Arquitetura](docs/arquitetura.md)** - Como o framework funciona por dentro
- **[Referencia PHP](docs/php-referencia.md)** - API completa das classes PHP
- **[Referencia JavaScript](docs/js-referencia.md)** - API completa das classes JS
- **[Componentes UI](docs/componentes.md)** - Guia de uso dos componentes visuais
- **[Compilador](docs/compilador.md)** - Sistema de build, packer e templates

---

## Licenca

MIT
