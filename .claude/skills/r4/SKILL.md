---
name: R4 Framework
description: Guia completo do framework R4 para desenvolvimento e validação de módulos PHP/JS. Use quando o usuário pedir para criar, validar ou trabalhar com módulos no framework R4.
argument-hint: "[criar|validar|info] [nomeModulo]"
---

# Framework R4 — Guia de Desenvolvimento

O R4 é um framework fullstack modular para PHP + JavaScript vanilla. **Convenção sobre configuração**: seguir as convenções abaixo é obrigatório — o compilador e o framework dependem delas.

---

## Estrutura de um Projeto R4

```
meuProjeto/
  r4.json                          # Configuração do compilador
  src/                             # Código-fonte (NUNCA edite public/ diretamente)
    _assets/
      css/global/                  # CSS incluído automaticamente em todas as páginas
      js/global/
        basico.class.js            # JS global (init de estruturas comuns)
        icons.js                   # Objeto Icons com SVGs para uso no JS
      php/
        log.class.php              # Classe Log do projeto (inseriu/alterou/excluiu/erro)
      templates/
        templates.html             # Templates globais (head, loading, endBody)
        icons.html                 # Templates de ícones SVG para uso no HTML
    config.inc.php                 # Configuração central do projeto (na raiz de src/)
    freeway.js.php                 # Retorna _CONFIG.rootURL sem verificar login
    gatekeeper.js.php              # Retorna _CONFIG com csrfToken, redireciona se não logado
    index.html
    manifest.json
    sworker.js
    nomeModulo/                    # Um módulo por pasta
      fields.json
      NomeModulo.class.php
      nomeModulo.class.js
      ajax.php
      index.html
      style.css
      templates/
        formNomeModulo.html
  public/                          # Gerada pelo compilador — NÃO editar
  vendor/php/
    composer.json
```

**Regra fundamental**: todo desenvolvimento ocorre em `src/`. A pasta `public/` é gerada automaticamente pelo compilador e é o que vai para produção.

---

## Convenções de Nomenclatura (obrigatórias)

| Arquivo | Convenção | Exemplo |
|---------|-----------|---------|
| Pasta do módulo | `src/nomeModulo/` (camelCase) | `src/usuarios/` |
| Classe PHP | `NomeModulo.class.php` (CamelCase) | `Usuarios.class.php` (classe `Usuarios`) |
| Classe JS | `nomeModulo.class.js` (camelCase) | `usuarios.class.js` (objeto `Usuarios`) |
| Schema de campos | sempre `fields.json` | — |
| Endpoint AJAX | sempre `ajax.php` | — |
| Página principal | sempre `index.html` | — |
| CSS do módulo | sempre `style.css` | — |
| Template do form | `form<NomeModulo>.html` | `formUsuarios.html` |

---

## Schema de Campos (fields.json)

O `fields.json` é a **única fonte de verdade** sobre os campos — tanto o frontend quanto o backend o usam para validação.

**Formato obrigatório**: objeto chaveado pelo nome do módulo. O array simples só funciona no PHP; no JS gera IDs errados (`0_campo`).

```json
{
  "nomeModulo": [
    {
      "id": "nome_campo",
      "type": "text",
      "required": true,
      "maxSize": 100,
      "minSize": 1,
      "exactSize": null,
      "regex": null,
      "precision": 2,
      "placeholder": "Dica...",
      "value": "",
      "classes": "col-6",
      "attr": "",
      "options": [{ "value": "1", "label": "Opção 1" }]
    }
  ]
}
```

### Tipos de Campo

**Texto**: `text`, `password`, `email`, `textarea`, `hidden`, `username`

**Numéricos**: `number`, `integer`, `integer-`, `decimal`, `decimal-`, `money`, `money-`, `percent`, `percent-`

**Brasileiros**: `cpf`, `cnpj`, `cpfcnpj`, `cep`, `phone`

**Data/Hora**: `date` (DD/MM/AAAA), `datetime` (DD/MM/AAAA HH:mm), `time` (HH:mm)

**Seleção**: `select`, `switch`, `tags`, `emailtags`, `phonetags`

**Upload**: `file`

**Botões**: `button`, `submit`, `reset`

---

## Estrutura da Classe PHP

```php
<?php
class NomeModulo {

    public $errMsg    = '';
    public $errObs    = '';
    public $errFields = [];

    public function read($id) {
        global $db;
        $id = (int)$id;
        if (!$id) {
            $this->errMsg = 'Código não informado';
            return false;
        }
        $dados = $db->sql("SELECT * FROM tabela WHERE id = :id LIMIT 1", ['id' => $id]);
        return $dados;
    }

    public function list($listFilter = [], $listParams = []) {
        global $db;
        $params = $this->listFilter($listFilter, $listParams);

        $list = $db->sql("
            SELECT id, nome
            FROM tabela
            WHERE excluido = 0
            {$params['strFilter']}
            ORDER BY {$params['orderBy']}
            LIMIT {$params['limit']}
        ", $params['bindFilter']);

        $count = $db->sql("
            SELECT count(*) as total
            FROM tabela
            WHERE excluido = 0
            {$params['strFilter']}
            LIMIT 1
        ", $params['bindFilter']);

        return [
            'list' => $list,
            'info' => [
                'orderBy'     => $params['orderBy'],
                'currentPage' => $params['currentPage'],
                'regPerPage'  => $params['regPerPage'],
                'totalReg'    => (int)$count['total'],
                'descrFilter' => $params['descrFilter']
            ]
        ];
    }

    private function listFilter($listFilter = [], $listParams = []) {
        if (!is_array($listParams)) $listParams = [];
        if (!is_array($listFilter)) $listFilter = [];

        $currentPage = @$listParams['currentPage'] ?: 1;
        $regPerPage  = @$listParams['regPerPage']  ?: 15;
        $orderBy     = R4::getOrderBy($listParams['orderBy'], 'nome');
        $limit       = R4::getLimit($currentPage, $regPerPage);
        $arrFilter   = [];
        $bindFilter  = [];
        $descrFilter = [];

        $busca = trim(@$listFilter['busca'] ?: '');
        if ($busca) {
            $arrFilter[]            = "AND nome LIKE :buscaLike";
            $bindFilter['buscaLike'] = '%' . $busca . '%';
            $descrFilter['Busca']   = $busca;
        }

        return [
            'limit'       => $limit,
            'orderBy'     => $orderBy,
            'currentPage' => $currentPage,
            'regPerPage'  => $regPerPage,
            'strFilter'   => implode(' ', $arrFilter),
            'bindFilter'  => $bindFilter,
            'descrFilter' => $descrFilter
        ];
    }

    public function save($id, $dados) {
        $id  = (int)$id;
        $new = [
            'nome' => $dados['nome'],
        ];
        $id = $id ? $this->update($id, $new) : $this->insert($new);
        if ($id === false) return false;
        return ['id' => $id];
    }

    public function insert($new) {
        global $db;
        if ($this->validFields($new) === false) return false;
        $db->sql("INSERT INTO tabela", $new);
        $id = $db->getInsertId();
        if (!$id) { $this->errMsg = 'Erro ao inserir'; return false; }
        Log::inseriu('nomeModulo', $id, $new);
        return $id;
    }

    public function update($id, $new) {
        global $db;
        $id  = (int)$id;
        $old = $db->sql("SELECT * FROM tabela WHERE id = :id LIMIT 1", ['id' => $id]);
        $arr = R4::mergeNewArr($old, $new);
        if ($this->validFields($arr['merged']) === false) return false;
        $db->sql("UPDATE tabela SET [fields] WHERE id = :id", array_merge($arr['merged'], ['id' => $id]));
        Log::alterou('nomeModulo', $id, $arr['changed']);
        return $id;
    }

    private function validFields($dados) {
        require_once R4PHP . 'validFields.class.php';
        $validFields = new ValidFields;
        $validFields->addSchema(dirname(__FILE__) . '/fields.json', 'nomeModulo');
        if (!$validFields->valid($dados)) {
            $this->errMsg    = $validFields->errMsg;
            $this->errObs    = $validFields->errObs;
            $this->errFields = $validFields->getValidateErrors();
            return false;
        }
        return true;
    }

    public function delete($ids) {
        global $db;
        $listId = R4::intArray($ids);
        $strId  = implode(', ', $listId);
        $rows   = $db->sql("SELECT id, excluido FROM tabela WHERE id IN ($strId)");
        $list   = [];
        foreach ($rows as $item) $list[$item['id']] = $item;
        $deleted = [];
        $alert   = [];
        foreach ($listId as $id) {
            if (!$list[$id]['id'])      { $alert[$id] = 'Item não encontrado'; continue; }
            if ($list[$id]['excluido']) { $alert[$id] = 'Item já excluído';    continue; }
            $db->sql("UPDATE tabela SET dtDel = now(), excluido = 1 WHERE id = :id", ['id' => $id]);
            $deleted[] = $id;
        }
        foreach ($deleted as $id) Log::excluiu('nomeModulo', $id);
        return ['deleted' => $deleted, 'alert' => $alert];
    }
}
```

---

## Estrutura do ajax.php

O roteamento usa a chave `com`, não `action`.

**`r4iniend.php` é chamado duas vezes por design** — no início e no final do arquivo. Na primeira chamada (quando `R4ALREADYINIT` ainda não está definido) ele inicializa o framework: verifica login, CSRF, conecta o banco, registra autoload. Na segunda chamada (ao final, quando `R4ALREADYINIT` já está definido) ele fecha a conexão com o banco via `$db->close()`. O nome "ini**end**" reflete exatamente isso. **Não remover a chamada do final.**

```php
<?php
$_CONFIG = ['requireLogin' => true, 'requireReferer' => true];
require '../config.inc.php';
require R4PHP . 'r4iniend.php'; // ← INI: inicializa framework e DB

$input = R4::getRequest();
require ROOT . 'nomeModulo/NomeModulo.class.php';
$modulo = new NomeModulo;

switch ($input['com'] ?? '') {

    case 'getInit':
        R4::retOkAPI();
        break;

    case 'read':
        $id    = (int)$input['idNomeModulo'];
        $dados = $modulo->read($id);
        if ($dados === false) {
            Log::erro('nomeModulo', $id, $modulo->errMsg, $modulo->errObs);
            R4::dieAPI(0, $modulo->errMsg, $modulo->errObs);
        }
        R4::retOkAPI(['item' => $dados]);
        break;

    case 'save':
        $id    = (int)$input['idNomeModulo'];
        $dados = $modulo->save($id, $input);
        if ($dados === false) {
            Log::erro('nomeModulo', $id, $modulo->errMsg, $modulo->errObs, $modulo->errFields);
            R4::dieAPI(0, $modulo->errMsg, $modulo->errObs, $modulo->errFields);
        }
        R4::retOkAPI(['item' => $dados]);
        break;

    case 'list':
        $dados = $modulo->list($input['listFilter'] ?? [], $input['listParams'] ?? []);
        if ($dados === false) R4::dieAPI(0, $modulo->errMsg, $modulo->errObs);
        R4::retOkAPI(['list' => $dados['list'], 'info' => $dados['info']]);
        break;

    case 'delete':
        $dados = $modulo->delete($input['ids']);
        if ($dados === false) R4::dieAPI(0, $modulo->errMsg, $modulo->errObs);
        R4::retOkAPI(['deleted' => $dados['deleted'], 'alert' => $dados['alert']]);
        break;

    default:
        R4::dieAPI(0, 'Comando inválido');
}

require R4PHP . 'r4iniend.php'; // ← END: fecha conexão com o banco
```

**Resposta de sucesso**: `{ "ok": 1, "list": [...], "item": {...} }`
**Resposta de erro**: `{ "error": 1, "errMsg": "...", "errObs": "...", "errFields": {"campo": ["msg"]} }`

---

## Estrutura da Classe JavaScript

O fluxo de `init()` segue a ordem: `getInit → initList → initEvents → filter → initForm`.
As chamadas AJAX usam a chave `com`, não `action`.
O preenchimento de campos no `edit()` é **sempre explícito**, campo a campo — permite lógica condicional por campo.

```javascript
var NomeModulo = {

    pathAjax:   _CONFIG.rootURL + 'nomeModulo/ajax.php',
    pathFields: _CONFIG.rootURL + 'nomeModulo/fields.json',
    pathForm:   _CONFIG.rootURL + 'nomeModulo/templates/formNomeModulo.html',
    pathCSS:    _CONFIG.rootURL + 'nomeModulo/style.css',

    idNomeModulo: 0,

    init: callback => {
        NomeModulo.getInit(() => {
            NomeModulo.initList();
            NomeModulo.initEvents();
            NomeModulo.filter();
            NomeModulo.initForm();
            if (typeof callback === 'function') callback();
        });
    },

    getInit: function(callback) {
        R4.getJSON(NomeModulo.pathAjax, { com: 'getInit' })
        .then(() => {
            if (typeof callback === 'function') callback();
        })
        .catch(err => { Warning.show('Erro ao buscar dados iniciais'); console.log(err); });
    },

    initList: () => {
        Table.create({
            idDestiny: 'listaNomeModulo',
            classes:   'striped sticky',
            arrHead: [
                { label: 'Id',   orderBy: 'id'   },
                { label: 'Nome', orderBy: 'nome'  }
            ],
            withCheck:    true,
            onLineClick:  value => NomeModulo.edit(value),
            onOrderBy:    () => NomeModulo.filter(),
            onPagination: () => NomeModulo.filter(),
            onRegPerPage: () => NomeModulo.filter()
        });
    },

    initEvents: function() {
        if ($('#nomeModuloBtnAdd')) $('#nomeModuloBtnAdd').on('click', NomeModulo.insert);
        if ($('#nomeModuloBtnDel')) $('#nomeModuloBtnDel').on('click', function() {
            NomeModulo.delete('listaNomeModulo');
        });
    },

    initForm: function() {
        Dialog.create({
            elem: $('#formNomeModulo'),
            title: 'Dados',
            changeMonitor: true,
            buttons: [
                {
                    label:   'Salvar',
                    classes: 'R4DialogSaver bgSuccess white',
                    onClick: function() { NomeModulo.save(); }
                },
                {
                    label:   'Fechar',
                    classes: 'R4DialogCloser'
                }
            ]
        });

        Fields.createFromFile(NomeModulo.pathFields, 'nomeModulo');
    },

    filter: function() {
        NomeModulo.list({
            listParams: Table.getInfo($('#listaNomeModulo')),
            listFilter: Fields.objectize($('#formFilter'))
        });
    },

    list: function(arrFilter) {
        if (!arrFilter) arrFilter = {};
        R4.getJSON(NomeModulo.pathAjax, {
            com:        'list',
            listParams: arrFilter.listParams,
            listFilter: arrFilter.listFilter
        })
        .then(ret => {
            let destiny = $('#listaNomeModulo'),
                body    = [];
            Table.setInfo(destiny, ret.info);
            if (!ret.list.length) { Table.clearBody(destiny); return; }
            ret.list.forEach(item => {
                body.push({ value: item.id, cells: [item.id, item.nome] });
            });
            Table.updateContent(destiny, body);
        })
        .catch(err => { Warning.show('Erro', err); console.log(err); });
    },

    insert: function() {
        NomeModulo.idNomeModulo = 0;
        Fields.reset($('#formNomeModulo'));
        Dialog.open($('#formNomeModulo'));
    },

    edit: id => {
        if (!id) return;
        R4.blockScreen(true);
        NomeModulo.idNomeModulo = 0;
        Fields.reset($('#formNomeModulo'));
        R4.getJSON(NomeModulo.pathAjax, { com: 'read', idNomeModulo: id })
        .then(ret => {
            R4.blockScreen(false);
            NomeModulo.idNomeModulo = ret.item.id;
            $('#nomeModulo_nome').val(ret.item.nome);
            // ... um campo por linha, com lógica condicional quando necessário
            Dialog.open($('#formNomeModulo'));
        })
        .catch(err => {
            R4.blockScreen(false);
            Warning.show('Erro ao buscar os dados');
            console.log(err);
        });
    },

    save: () => {
        R4.blockScreen(true);
        Fields.remAllErrFields();
        let params = Fields.objectize($('#formNomeModulo'), {
            com:          'save',
            idNomeModulo: NomeModulo.idNomeModulo
        });
        R4.getJSON(NomeModulo.pathAjax, params)
        .then(ret => {
            R4.blockScreen(false);
            Warning.show('Salvo com sucesso!');
            NomeModulo.onSave();
            Dialog.close($('#formNomeModulo'));
        })
        .catch(err => {
            R4.blockScreen(false);
            NomeModulo.onSaveError(err);
        });
    },

    onSave: () => { NomeModulo.filter(); },

    onSaveError: err => {
        Fields.setErrFields(err, 'nomeModulo');
        console.log(err);
    },

    delete: id => {
        let ids = (isNaN(id)) ? Table.getAllSel(id) : id;
        if (!ids.length) { Warning.show('Nenhum código informado'); return; }
        R4.getJSON(NomeModulo.pathAjax, { com: 'delete', ids })
        .then(ret => {
            if (ret.deleted.length) {
                Warning.show('Excluídos: ' + ret.deleted.join(', '));
                NomeModulo.filter();
            }
            if (ret.alert) {
                for (let k in ret.alert) Warning.show('Erro no item ' + k, ret.alert[k]);
            }
        });
    }
};
```

---

## Estrutura do index.html

```html
<!DOCTYPE HTML>
<html lang="pt-BR">
    <head>
        <base href="../">
        <title>NomeModulo</title>
        <!--
            Páginas públicas: freeway.js.php (só rootURL)
            Páginas com login: gatekeeper.js.php (rootURL + csrfToken, redireciona se não logado)
        -->
        <script src="freeway.js.php"></script>
        <!--R4TEMPLATE-head-->
    </head>
    <body>
        <!--R4TEMPLATE-loading-->

        <main>
            <nav class="panel bgWhite corner clearfix hiddenPrint">
                <h2>NomeModulo</h2>
                <button id="nomeModuloBtnAdd" class="R4 bgSuccess white bold">Novo</button>
                <button id="nomeModuloBtnDel" class="R4 bgWarning white bold">
                    <!--R4TEMPLATE-icon-trash-->
                </button>
            </nav>

            <div id="listaNomeModulo" class="panel bgWhite corner"></div>
        </main>

        <form id="formNomeModulo" class="hidden"></form>

        <link rel="stylesheet" href="R4Cache::nomeModulo/style.css">
        <script defer src="R4Cache::nomeModulo/nomeModulo.class.js"></script>

        <script>
            const R4Init = () => {
                NomeModulo.init();
            };
        </script>

        <!--R4TEMPLATE-endBody-->
    </body>
</html>
```

**Marcadores especiais do compilador**:
- `<!--R4TEMPLATE-nome-->` — substituído pelo bloco definido em `_assets/templates/*.html`
- `R4Cache::caminho` — substituído por `caminho?timestamp` (cache busting)
- Templates de módulo em `templates/` são injetados automaticamente antes do `</body>`

---

## Objeto Icons (icons.js)

`icons.js` em `_assets/js/global/` exporta SVGs como strings para uso em JS dinâmico.
`icons.html` em `_assets/templates/` define os mesmos ícones para injeção em HTML estático via `<!--R4TEMPLATE-icon-nome-->`.

**Regra de nomenclatura**: mesmo nome nos dois arquivos se o SVG for idêntico; nomes diferentes se forem variantes visuais distintas.

```javascript
// Uso em botões criados dinamicamente:
label: Icons.search + '<span>Filtrar</span>'

// Override de ícones do framework (ao final de icons.js):
// Table.iconOrderBy  = Icons.caretDown;
// Dialog.iconCloser  = Icons.close;
```

---

## Log de Eventos (log.class.php)

Classe estática do projeto em `_assets/php/log.class.php`. Usar em todas as operações críticas:

```php
Log::inseriu('nomeModulo', $id, $new);          // novo registro
Log::alterou('nomeModulo', $id, $alt);           // campos alterados
Log::excluiu('nomeModulo', $id);                 // exclusão
Log::erro('nomeModulo', $id, $msg, $obs, $fields); // erro de operação
```

---

## Sistema de Grid CSS

Sistema responsivo de 12 colunas. Use a classe `col-N` nos divs do template de formulário:

- `col-12` — largura total
- `col-6` — metade
- `col-4` — um terço
- `col-3` — um quarto
- `col-xs-12` — largura total em mobile

---

## Compilação src → public

```bash
# Na pasta do projeto:
../r4/r4 up            # Compilação única
../r4/r4 up monitor    # Modo watch (recompila ao salvar)

# Criar novo módulo a partir do template:
../r4/r4 initmodule nomeModulo
```

**r4.json** — controla a compilação:
```json
{
  "R4JSPacker":  1,
  "R4CSSPacker": 1,
  "JSPacker":    0,
  "CSSPacker":   0,
  "HTMLPacker":  0,
  "foldersToMonitor": ["./src", "./vendor"],
  "concatFiles": {}
}
```

Manter `JSPacker`, `CSSPacker`, `HTMLPacker` = 0 durante desenvolvimento; = 1 para produção.

---

## Fluxo de Dados Padrão

```
1. Usuário interage → Fields.validateForm() / Fields.objectize() coleta dados
2. R4.getJSON('ajax.php', { com: 'acao', ... }) envia via POST
3. ajax.php roteia pelo switch($input['com'])
4. Classe PHP: validFields() valida → DB executa → Log registra → retOkAPI() / dieAPI()
5. Promise resolve → Table.updateContent() / Fields.setErrFields() / Warning.show()
```

---

## Componentes Principais

| Componente | JS | PHP | Descrição |
|---|---|---|---|
| R4 | `R4` | `R4` | AJAX, helpers, utilitários |
| Fields | `Fields` | `ValidFields` | Formulários, validação dupla |
| Table | `Table` | — | Tabelas dinâmicas com paginação |
| Dialog | `Dialog` | — | Diálogos modais com changeMonitor |
| Warning | `Warning` | — | Notificações toast |
| Tabs | `Tabs` | — | Sistema de abas |
| Icons | `Icons` | — | SVGs globais (global/icons.js) |
| DB | — | `DB` | Banco com binding automático |
| Log | — | `Log` | Log de eventos (projeto) |
| Security | — | `Security` | Criptografia e chaves |

**Aliases JS globais**: `$()` (seletor), `$each()`, `$new()`, `_CONFIG` (rootURL, csrfToken)

---

## Checklist de Validação de Módulo

Ao validar um módulo existente, verificar:

**Estrutura**
- [ ] 6 arquivos presentes: `fields.json`, `NomeModulo.class.php`, `nomeModulo.class.js`, `ajax.php`, `index.html`, `style.css`
- [ ] Pasta `templates/` com `formNomeModulo.html`
- [ ] Arquivos em `src/`, não em `public/`
- [ ] Nomenclatura correta (camelCase pasta, CamelCase classe PHP, mesmo nome no JS)

**fields.json**
- [ ] Formato objeto chaveado `{ "nomeModulo": [...] }`
- [ ] Campos com `id`, `type`; obrigatórios com `"required": true` (booleano, não string)

**PHP**
- [ ] Classe tem `$errMsg`, `$errObs`, `$errFields`
- [ ] `validFields()` usa `require_once R4PHP . 'validFields.class.php'`
- [ ] `addSchema()` recebe `dirname(__FILE__) . '/fields.json'` e o prefixo do módulo
- [ ] Erros retornados via `$validFields->getValidateErrors()` (não `->errFields`)
- [ ] `delete()` usa soft delete (`excluido = 1`, `dtDel = now()`)
- [ ] `list()` tem paginação via `R4::getLimit()` e ordenação via `R4::getOrderBy()`
- [ ] Operações críticas registradas com `Log::inseriu/alterou/excluiu/erro`

**ajax.php**
- [ ] `require '../config.inc.php'` (raiz de src/, não em _assets/)
- [ ] `require R4PHP . 'r4iniend.php'` presente **duas vezes**: no início (ini) e no final (end/fecha DB) — ambos são obrigatórios e intencionais
- [ ] Roteamento via `$input['com']` (não `action`)
- [ ] Respostas via `R4::retOkAPI()` / `R4::dieAPI()`
- [ ] Erros logados com `Log::erro()` antes do `dieAPI()`

**JavaScript**
- [ ] Chamadas AJAX usam `{ com: 'acao' }` (não `action`)
- [ ] `init()` chama `getInit()` antes de inicializar lista/eventos/form
- [ ] `edit()` preenche campos explicitamente via `$('#modulo_campo').val()`
- [ ] `save()` usa `Fields.remAllErrFields()` antes de enviar
- [ ] `onSaveError()` usa `Fields.setErrFields(err, 'prefixo')`

**index.html**
- [ ] `<base href="../">` presente
- [ ] `freeway.js.php` ou `gatekeeper.js.php` incluído antes de `<!--R4TEMPLATE-head-->`
- [ ] Scripts do módulo com `R4Cache::` para cache busting
- [ ] `R4Init` definido chamando `NomeModulo.init()`
- [ ] `<!--R4TEMPLATE-endBody-->` ao final do body

---

## Instruções de Uso desta Skill

- **Criar módulo**: gere os arquivos seguindo as estruturas acima, adaptando para a entidade solicitada
- **Validar módulo**: leia os arquivos do módulo e compare com o checklist acima
- **Dúvidas sobre o framework**: consulte a pasta `docs/` do repositório do R4 para detalhes aprofundados
- **Nunca edite** arquivos em `public/` — sempre em `src/`
- **Sempre use** o compilador para ver as mudanças em produção
