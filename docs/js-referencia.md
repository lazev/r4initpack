# Referencia JavaScript

## Seletor $() e $each()

O R4 possui um seletor de elementos leve que substitui jQuery.

### `$(seletor)` / `$(elemento)`

Seleciona um elemento do DOM e adiciona metodos R4.

```javascript
let btn = $('#meuBotao');         // por ID
let el  = $('.minhaClasse');     // por classe (primeiro encontrado)
let div = $('div.container');    // seletor CSS
let raw = $(document.body);     // elemento existente
```

### `$each(seletor, callback)`

Executa funcao em todos os elementos que correspondem ao seletor.

```javascript
$each('.item', (elem, index) => {
    elem.style.color = 'red';
});
```

### `$new(html)`

Cria um novo elemento a partir de HTML.

```javascript
let btn = $new('<button class="primary">Salvar</button>');
document.body.appendChild(btn);
```

### Metodos do elemento

Apos selecionar com `$()`, o elemento ganha estes metodos:

#### `.on(evento, funcao)`
```javascript
$('#btn').on('click', () => alert('Clicado!'));
```

#### `.trigger(evento, dados)`
```javascript
$('#btn').trigger('click');
$('#btn').trigger('meuEvento', { id: 5 });
```

#### `.val(valor, label)`
```javascript
let v = $('#campo').val();         // obter valor
$('#campo').val('novo valor');     // definir valor
$('#select').val(2, 'Opcao 2');   // definir valor com label
```

#### `.attr(nome, valor)`
```javascript
let id = $('#el').attr('data-id');     // obter
$('#el').attr('data-id', '5');         // definir
```

#### `.find(seletor)`
```javascript
let items = $('#container').find('.item');
```

#### `.visible()`
```javascript
if ($('#painel').visible()) { ... }
```

---

## R4 (r4.class.js)

Classe principal com utilitarios, AJAX e helpers.

---

### AJAX

#### `R4.getJSON(url, params, opts)`

Requisicao AJAX via POST (padrao). Retorna Promise.

```javascript
// POST simples
R4.getJSON('ajax.php', { action: 'list' }).then(ret => {
    if (ret.error) return Warning.show(ret.errMsg, ret.errObs);
    console.log(ret.list);
});

// GET
R4.getJSON('ajax.php?action=list', {}, { method: 'GET' }).then(ret => { ... });

// Com tratamento de erro
R4.getJSON('ajax.php', { action: 'save', name: 'Joao' })
    .then(ret => {
        if (ret.error) return Fields.setErrFields(ret);
        Warning.show('Salvo!');
    });
```

#### `R4.sendBlob(url, params)`

Envia FormData (para upload de arquivos). Retorna Promise.

```javascript
let form = new FormData();
form.append('file', fileInput.files[0]);
form.append('action', 'upload');

R4.sendBlob('ajax.php', form).then(ret => { ... });
```

#### `R4.getHTML(source)`

Busca conteudo HTML. Retorna Promise.

```javascript
R4.getHTML('template.html').then(html => {
    document.body.innerHTML += html;
});
```

#### `R4.setRemoteHTML(destiny, source, callback)`

Carrega HTML remoto dentro de um elemento.

```javascript
R4.setRemoteHTML($('#container'), 'conteudo.html', () => {
    console.log('Carregado!');
});
```

---

### Scripts e recursos

#### `R4.getScript(files)`

Carrega arquivos JS dinamicamente. Retorna Promise.

```javascript
R4.getScript(['lib/chart.js', 'lib/utils.js']).then(() => {
    // scripts carregados
});
```

#### `R4.importCSS(source)`

Injeta link CSS na pagina.

```javascript
R4.importCSS('css/relatorio.css');
```

---

### Templates e render

#### `R4.getTemplate(elem)`

Clona conteudo de um `<template>`.

```javascript
let clone = R4.getTemplate($('#tplCard'));
document.body.appendChild(clone);
```

#### `R4.render(templateElem, payload, format)`

Renderiza template com dados. Substitui `{{variavel}}` pelos valores.

```javascript
// Template: <div>{{name}} - {{email}}</div>
let html = R4.render($('#tplUser'), { name: 'Joao', email: 'j@mail.com' });
```

O parametro `format` permite formatar valores:
```javascript
R4.render($('#tpl'), data, {
    price: val => R4.moneyMask(val),
    date:  val => R4.dateMask(val)
});
```

#### `R4.renderLoop(loopElem, payload)`

Renderiza array em template com `[loop]...[/loop]`.

---

### Validacao

#### `R4.checkDate(dateStr)`
```javascript
R4.checkDate('2024-01-15');   // true
R4.checkDate('invalido');      // false
```

#### `R4.checkMail(email)`
```javascript
R4.checkMail('user@mail.com');   // true
```

#### `R4.checkCPF(value)` / `R4.checkCNPJ(value)` / `R4.checkCPFCNPJ(value)`
```javascript
R4.checkCPF('12345678909');      // true/false
R4.checkCNPJ('12345678000190');  // true/false
```

---

### Mascaras e formatacao

#### `R4.numberMask(number, mindec, maxdec)`
```javascript
R4.numberMask(1234.5);        // "1.234,50"
R4.numberMask(1234.567, 2, 4);  // "1.234,567"
```

#### `R4.moneyMask(number, mindec, maxdec)`
```javascript
R4.moneyMask(1234.5);   // "R$ 1.234,50"
```

#### `R4.numberUnmask(num)` / `R4.toUSNumber(num)`
```javascript
R4.numberUnmask('1.234,50');   // 1234.5
R4.toUSNumber('1.234,50');     // 1234.5
```

#### `R4.toEUNumber(num)`
```javascript
R4.toEUNumber(1234.5);   // "1.234,50"
```

#### `R4.dateMask(date)` / `R4.dateUnmask(dt)`
```javascript
R4.dateMask('2024-01-15');     // "15/01/2024"
R4.dateUnmask('15/01/2024');   // "2024-01-15"
```

#### `R4.cepMask(v)` / `R4.phoneMask(v)` / `R4.cpfMask(v)` / `R4.cnpjMask(v)` / `R4.cpfcnpjMask(v)`
```javascript
R4.cepMask('12345678');          // "12345-678"
R4.phoneMask('11999990000');     // "(11) 99999-0000"
R4.cpfMask('12345678909');       // "123.456.789-09"
R4.cnpjMask('12345678000190');   // "12.345.678/0001-90"
```

#### `R4.integerMask(v)` / `R4.decimalInputMask(v)`
```javascript
R4.integerMask('abc123');       // "123"
R4.decimalInputMask('10+5');    // permite operadores matematicos
```

---

### Data e hora

#### `R4.currentDate()` / `R4.currentDateTime()`
```javascript
R4.currentDate();       // "2024-01-15"
R4.currentDateTime();   // "2024-01-15 14:30:00"
```

#### `R4.changeDate(dtStr, year, month, day)`
```javascript
R4.changeDate('2024-01-15', 0, 0, 7);    // "2024-01-22"
R4.changeDate('2024-01-15', 0, 0, -5);   // "2024-01-10"
```

#### `R4.completeDate(str)` / `R4.completeTime(str)` / `R4.completeDateTime(str)`

Autocompleta entradas parciais de data/hora.

```javascript
R4.completeDate('15');       // "15/01/2024" (dia atual + mes/ano atual)
R4.completeDate('1501');     // "15/01/2024"
R4.completeTime('14');       // "14:00"
R4.completeDateTime('15');   // "15/01/2024 00:00"
```

---

### Strings

#### `R4.stripAccents(str)`
```javascript
R4.stripAccents('acao');   // "acao"
```

#### `R4.friendlyName(v)`
```javascript
R4.friendlyName('Produto Especial #1');   // "produto-especial-1"
```

#### `R4.onlyNumbers(v)`
```javascript
R4.onlyNumbers('(11) 99999-0000');   // "11999990000"
```

#### `R4.plural(txt, num, pluralTxt, singularTxt)`
```javascript
R4.plural('item', 5, 'itens');     // "5 itens"
R4.plural('item', 1, 'itens');     // "1 item"
```

---

### Utilitarios

#### `R4.uniqid()`
Gera ID unico baseado em timestamp.

#### `R4.ifNull(val, default)`
```javascript
R4.ifNull(null, 'padrao');    // "padrao"
R4.ifNull('valor', 'padrao'); // "valor"
```

#### `R4.round(num, dec)`
```javascript
R4.round(3.14159, 2);   // 3.14
```

#### `R4.arrayVal(arr, key)`
Busca objeto por propriedade `key` em array de objetos.

#### `R4.resolveFunc(name)`
Resolve funcao por caminho em string (alternativa segura a eval).

```javascript
let fn = R4.resolveFunc('MeuModulo.salvar');
fn();   // executa MeuModulo.salvar()
```

---

### Interface

#### `R4.blockScreen(bool)`
Desabilita/habilita todos os botoes da tela.

```javascript
R4.blockScreen(true);    // desabilita tudo
R4.blockScreen(false);   // reabilita
```

#### `R4.typeEffect(elem, txt, speed)`
Efeito de digitacao em um elemento.

```javascript
R4.typeEffect($('#titulo'), 'Bem-vindo ao sistema', 50);
```

#### `R4.newBrowserTab(url)`
Abre URL em nova aba.

#### `R4.sWorker(swFilePath)`
Registra Service Worker para PWA.

---

### URL e hash

#### `R4.getHashParams(hash)`
```javascript
// URL: pagina.html#modulo/42/edit
R4.getHashParams();   // ['modulo', '42', 'edit']
```

#### `R4.getURLParams(filter)`
```javascript
// URL: pagina.html?id=5&name=Joao
R4.getURLParams();         // {id: '5', name: 'Joao'}
R4.getURLParams('id');     // '5'
```

---

### Checkboxes

#### `R4.enableShiftCheck(idDestiny)`

Habilita selecao em lote com Shift+Click em checkboxes.

```javascript
R4.enableShiftCheck('tblUsers');
```

---

### Iframe AJAX

#### `R4.iframeAjax(url, params)`

Envia dados via iframe oculto (util para downloads).

```javascript
R4.iframeAjax('export.php', { action: 'download', format: 'xlsx' });
```

---

## R4Init

Funcao global executada automaticamente quando a pagina carrega. Defina-a para inicializar seu modulo:

```javascript
function R4Init() {
    MeuModulo.list();
}
```
