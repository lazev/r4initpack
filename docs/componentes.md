# Componentes UI

## Fields

Sistema completo de formularios com criacao automatica, validacao, mascaras e tipos especializados.

### Criando campos a partir de JSON

```javascript
// Carrega fields.json e cria os campos dentro de elementos com atributo data-r4f="id"
Fields.createFromFile('fields.json').then(() => {
    console.log('Campos criados');
});

// Ou a partir de um objeto
Fields.create([
    { id: 'name', type: 'text', label: 'Nome', required: true },
    { id: 'email', type: 'email', label: 'E-mail' }
], 'prefixo');
```

### Tipos de campo suportados

| Tipo | Descricao | Mascara |
|---|---|---|
| `text` | Texto livre | - |
| `email` | E-mail com validacao | - |
| `password` | Senha (oculto) | - |
| `number` | Numero generico | - |
| `integer` | Inteiro positivo | Apenas digitos |
| `integer-` | Inteiro (permite negativo) | Digitos e sinal |
| `decimal` | Decimal positivo | 0,00 |
| `decimal-` | Decimal (permite negativo) | 0,00 |
| `money` | Monetario positivo | R$ 0,00 |
| `money-` | Monetario (permite negativo) | R$ 0,00 |
| `percent` | Percentual positivo | 0,00 |
| `percent-` | Percentual (permite negativo) | 0,00 |
| `date` | Data com calendar picker | DD/MM/AAAA |
| `datetime` | Data e hora | DD/MM/AAAA HH:mm |
| `time` | Hora | HH:mm |
| `textarea` | Texto longo | - |
| `select` | Dropdown | - |
| `switch` | Checkbox com label | - |
| `tags` | Tags com autocomplete | - |
| `emailtags` | Tags de e-mail | - |
| `phonetags` | Tags de telefone | - |
| `cpf` | CPF | XXX.XXX.XXX-XX |
| `cnpj` | CNPJ | XX.XXX.XXX/XXXX-XX |
| `cpfcnpj` | CPF ou CNPJ | Automatico |
| `cep` | CEP | XXXXX-XXX |
| `phone` | Telefone | (XX) XXXXX-XXXX |
| `username` | Nome de usuario | Apenas letras, numeros, pontos |
| `file` | Upload de arquivo | - |
| `hidden` | Campo oculto | - |
| `button` | Botao | - |
| `submit` | Botao de submit | - |
| `reset` | Botao de reset | - |

### Propriedades do campo (JSON)

```json
{
    "id": "price",
    "name": "price",
    "type": "money",
    "label": "Preco",
    "placeholder": "0,00",
    "value": "",
    "required": true,
    "minSize": 1,
    "maxSize": 10,
    "exactSize": null,
    "regex": null,
    "precision": 2,
    "classes": "col-6",
    "attr": "data-custom='valor'",
    "options": [
        {"value": "1", "label": "Opcao 1"},
        {"value": "2", "label": "Opcao 2"}
    ]
}
```

### Validacao

```javascript
// Validar campo individual
Fields.validate($('#name'));

// Validar formulario inteiro (retorna objeto com valores ou false)
let data = Fields.validateForm($('#meuForm'));
if (!data) return;  // campos invalidos

// Validar array de campos especificos
let data = Fields.validateAndGetVal(['#name', '#email', '#phone']);

// Exibir erros vindos da API
Fields.setErrFields(ret);   // ret = { errFields: { name: 'Obrigatorio' } }

// Erros manuais
Fields.setError($('#email'), 'E-mail ja cadastrado');
Fields.remError($('#email'));
Fields.remAllErrFields($('#meuForm'));
```

### Obter e definir valores

```javascript
// Obter valor
let name = $('#name').val();          // metodo do seletor
let name = Fields.getVal($('#name')); // metodo direto

// Obter texto (para selects e tags)
let label = Fields.getText($('#status'));
let label = Fields.getLabel($('#name'));

// Definir valor
$('#name').val('Joao');
Fields.setVal($('#status'), 2, 'Ativo');

// Obter todos os valores do formulario como objeto
let data = Fields.objectize($('#meuForm'));
// { name: 'Joao', email: 'j@mail.com', status: 2 }

// Obter checkboxes marcados
let ids = Fields.getArrCheckbox($('#groupStatus'));
```

### Controle de estado

```javascript
Fields.enable($('#name'), true);     // habilitar
Fields.enable($('#name'), false);    // desabilitar
Fields.editable($('#name'), false);  // somente leitura
Fields.reset($('#meuForm'));         // limpar formulario
```

### Selects

```javascript
// Popular opcoes de select
Fields.setSelectOpts($('#status'), [
    { value: 1, label: 'Ativo' },
    { value: 0, label: 'Inativo' }
], 1);  // valor pre-selecionado

// Opcoes podem vir de uma funcao
{ "id": "city", "type": "select", "options": "MeuModulo.getCities" }
```

### Calculo em campos

Campos decimais suportam formulas com `=`:

```javascript
// O usuario pode digitar: =10+5*2
// O campo calcula: 20
Fields.setCalcEvents($('#campo'));
Fields.calc('10+5*2');   // 20
```

---

## Table

Tabelas dinamicas com ordenacao, paginacao e selecao.

### Criacao

```javascript
Table.create({
    idElem: 'tblUsers',
    arrHead: [
        { label: 'Nome',   type: 'text',    orderBy: 'name' },
        { label: 'E-mail', type: 'text',    orderBy: 'email' },
        { label: 'Valor',  type: 'money',   orderBy: 'price' },
        { label: 'Data',   type: 'date',    orderBy: 'created' },
        { label: '',       type: 'button' }
    ],
    arrBody: body,
    arrFoot: foot,
    withCheck: true,
    onOrderBy: (params) => MeuModulo.list(params),
    onLineSel: (params) => MeuModulo.onSelect(params),
    onLineClick: (value) => MeuModulo.edit(value),
    onRegPerPage: (params) => MeuModulo.list(params),
    onPagination: (params) => MeuModulo.list(params)
});
```

### Montando linhas

```javascript
let body = [];

data.forEach(item => {
    Table.initLine();
    Table.addCell(item.name);
    Table.addCell(item.email);
    Table.addCell(R4.moneyMask(item.price));
    Table.addCell(R4.dateMask(item.date));
    Table.addCell('<button onclick="edit(' + item.id + ')">Editar</button>');

    body.push({
        value: item.id,
        cells: Table.getCells(),
        classes: Table.getClasses()
    });
});
```

### Atualizando conteudo

```javascript
Table.updateContent($('#tblUsers'), body, foot);
Table.clearBody($('#tblUsers'));
Table.appendBody($('#tblUsers'), moreRows);
```

### Paginacao

```javascript
Table.createPagination();
Table.updatePagination($('#tblUsersPag'), regPerPage, totalReg, currentPage);
Table.createRegPerPage($('#tblUsersRpp'));
Table.updateRegPerPage($('#tblUsersRpp'), regPerPage);
```

### Informacoes da tabela

```javascript
let info = Table.getInfo($('#tblUsers'));
// { orderBy: 'name', orderDir: 'ASC', page: 1, regPerPage: 20 }

Table.setInfo($('#tblUsers'), { orderBy: 'email', page: 2 });
```

### Selecao

```javascript
let selected = Table.getAllSel('tblUsers');   // array de IDs selecionados
```

### Colunas extras

```javascript
Table.listColSelector('tblUsersColSel', 
    ['phone', 'address'],     // colunas disponiveis
    ['phone']                  // colunas ja selecionadas
);
```

---

## Dialog

Dialogos modais com sistema de botoes e monitoramento de alteracoes.

### Abrir dialogo

```javascript
// Criar e abrir
Dialog.open({
    id: 'dlgUser',
    title: 'Editar Usuario',
    html: '<form id="formUser">...</form>',
    buttons: [
        { label: 'Cancelar', classes: 'R4DialogCloser' },
        { label: 'Salvar', onClick: () => Users.save(), classes: 'R4DialogSaver primary' }
    ],
    onOpen: () => Fields.createFromFile('fields.json'),
    onClose: () => console.log('Fechou')
});

// Abrir dialogo existente no DOM
Dialog.open($('#dlgUser'));

// Abrir com opcoes
Dialog.open($('#dlgUser'), {
    title: 'Novo Titulo',
    onOpen: () => { ... }
});
```

### Criar sem abrir

```javascript
Dialog.create({
    id: 'dlgConfig',
    title: 'Configuracoes',
    html: configHTML,
    open: false
}).then(id => {
    // dialogo criado, pode abrir depois
});
```

### Fechar

```javascript
Dialog.close($('#dlgUser'));           // fecha com verificacao de alteracoes
Dialog.closeAnyway($('#dlgUser'));     // fecha sem perguntar
Dialog.closeLastOpen();                // fecha o ultimo aberto
```

### Configuracoes

```javascript
Dialog.open({
    id: 'dlg',
    title: 'Titulo',
    html: '<div>Conteudo</div>',
    elem: null,                     // elemento DOM existente
    style: { width: '600px' },      // CSS inline
    classes: 'large',               // classes CSS
    open: true,                     // abrir ao criar
    ephemeral: true,                // remover do DOM ao fechar
    changeMonitor: true,            // avisar se houver alteracoes nao salvas
    clickOverlayClose: true,        // fechar ao clicar no overlay
    buttons: [...],
    onOpen: () => {},
    onCreate: () => {},
    onClose: () => {},
    beforeClose: () => true          // retornar false para impedir fechamento
});
```

### Botoes especiais

- `R4DialogCloser` - Botao fecha o dialogo automaticamente
- `R4DialogSaver` - Botao de salvar (visualmente destacado)

### Monitoramento de alteracoes

```javascript
Dialog.setChangeMonitor($('#dlgUser'));
// Se o usuario alterar campos e tentar fechar, sera avisado
```

### Outros

```javascript
Dialog.title($('#dlgUser'), 'Novo Titulo');
Dialog.appendOnFooter($('#dlgUser'), '<button>Extra</button>');
Dialog.getIdOpenOverlays();   // ['dlgUser', 'dlgConfig']
```

---

## Tabs

Interface de abas.

### Criacao

```html
<div id="tabsUser">
    <button data-target="tabDados">Dados</button>
    <button data-target="tabEndereco">Endereco</button>
    <button data-target="tabConfig">Configuracoes</button>
</div>

<div id="tabDados">...</div>
<div id="tabEndereco">...</div>
<div id="tabConfig">...</div>
```

```javascript
Tabs.create({
    idElem: 'tabsUser',
    primary: 'tabDados',
    click: (targetId) => console.log('Aba:', targetId)
});
```

### Navegacao

```javascript
Tabs.click('tabEndereco');              // ativar aba
Tabs.reset($('#tabsUser'));             // voltar para a primaria
Tabs.getActive($('#tabsUser'));         // aba ativa
Tabs.getAllTabs($('#tabsUser'));         // todos os botoes
Tabs.getAllTargets($('#tabsUser'));      // todos os IDs de destino
```

### Indicador de erros

```javascript
// Marca as abas que contem campos com erro
Tabs.markTabsWithErrFields($('#tabsUser'));
```

---

## Warning

Notificacoes toast.

### Exibir

```javascript
Warning.show('Salvo com sucesso!');
Warning.show('Erro ao salvar', 'Verifique os campos');
Warning.show('Mensagem importante', '', { fixed: true });
Warning.show('Custom', '', { id: 'wrnCustom' });
```

### Fechar

```javascript
Warning.hide($('#wrnCustom'));
Warning.hideAll();   // fecha todas (exceto fixed)
```

---

## Pop

Popups flutuantes e tooltips.

### Hints (tooltips)

```javascript
// Hint aparece no hover/focus
Pop.hint($('#btn'), 'Texto do tooltip');
Pop.hint($('#btn'), 'Tooltip', { classes: 'large' });
```

### Popup no click

```javascript
Pop.click($('#btn'), {
    html: '<div>Conteudo do popup</div>',
    id: 'popMenu',
    classes: 'menu',
    overlay: true,
    onOpen: () => console.log('Abriu'),
    preventDefault: true
});
```

### Popup manual

```javascript
Pop.create({
    destiny: $('#btn'),
    html: '<ul><li>Item 1</li></ul>',
    id: 'popList'
});
```

### Destruir

```javascript
Pop.destroyById('popMenu');
Pop.destroyByParent($('#btn'));
Pop.destroyElem($('#popMenu'));
```

---

## Sbar (Sidebar)

Painel lateral com suporte a gestos touch.

### Criacao

```javascript
Sbar.create({
    id: 'sbarMenu',
    direction: 'left',          // left, right, up, down
    touchMonitor: true,         // gestos de swipe
    opened: false,
    onOpen: () => console.log('Abriu'),
    onClose: () => console.log('Fechou')
});
```

### Controle

```javascript
Sbar.open($('#sbarMenu'));
Sbar.close($('#sbarMenu'));
Sbar.toggle($('#sbarMenu'));
Sbar.isOpened($('#sbarMenu'));   // true/false
```

---

## Effects

Animacoes e efeitos visuais.

### Slide

```javascript
Effects.slideDown($('#painel'), () => console.log('Abriu'));
Effects.slideUp($('#painel'), () => console.log('Fechou'));
```

### Fade

```javascript
Effects.fadeIn($('#elem'), null, 300);        // duracao em ms
Effects.fadeOut($('#elem'), null, 300);
Effects.fadeIn($('#elem'), null, 300, 'flex'); // display customizado
```

### Destaque

```javascript
Effects.highlight($('#linha'));    // flash amarelo de 500ms
Effects.blink($('#elem'), 3);     // piscar 3 vezes
```

---

## DatePicker (fieldsdtpicker.class.js)

Calendario integrado aos campos do tipo `date`.

O DatePicker e criado automaticamente quando o campo tem `type: "date"`. Nao e necessario inicializa-lo manualmente.

### Uso manual (raro)

```javascript
FieldsDtPicker.create($('#meuCampoDate'));
FieldsDtPicker.setVal($('#meuCampoDate'), '2024-01-15');
```

---

## Tags (fieldstags.class.js)

Entrada de tags/chips com autocomplete opcional.

Tags sao criadas automaticamente para campos com `type: "tags"`, `"emailtags"` ou `"phonetags"`.

### Configuracao no JSON

```json
{
    "id": "categories",
    "type": "tags",
    "label": "Categorias",
    "typeahead": "json",
    "source": "MeuModulo.getCategorias",
    "minLength": 2,
    "allowFreeText": true,
    "maxSel": 5,
    "hideInputOnMaxSel": true,
    "autoSelectFirst": true
}
```

### Manipulacao via JS

```javascript
FieldsTags.addTag($('#categories'), 'tech', 'Tecnologia');
FieldsTags.remTag($('#categories'), tagElement);
FieldsTags.clrTag($('#categories'));

let values = FieldsTags.getVal($('#categories'));        // "1,2,3"
let labels = FieldsTags.getText($('#categories'));       // "Tech, Saude, ..."
let arr    = FieldsTags.getVal($('#categories'), true);  // [1, 2, 3]

FieldsTags.setVal($('#categories'), '1,2', 'Tech, Saude');
FieldsTags.appendVal($('#categories'), '3', 'Esporte');
```

---

## Classes CSS utilitarias

### Cores de fundo
`bgPrimary`, `bgInfo`, `bgDanger`, `bgSuccess`, `bgWarning`, `bgFancy`, `bgGrey`, `bgLight`

### Cores de texto
`primary`, `info`, `danger`, `success`, `warning`, `fancy`, `grey`, `light`

### Layout
`center`, `right`, `left`, `hidden`, `block`, `onRight`, `onLeft`

### Efeitos
`corner` (borda arredondada), `paspatur` (padding), `shadow`, `clickable` (cursor pointer), `nowrap`, `noscroll`, `bold`, `small`, `badge`, `transition`

### Grid

Sistema de grid responsivo com 12 colunas:

```html
<div class="row">
    <div class="col-6">Metade</div>
    <div class="col-6">Metade</div>
</div>

<div class="row">
    <div class="col-4">1/3</div>
    <div class="col-8">2/3</div>
</div>
```
