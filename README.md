# R4 Visual Framework

JS e CSS de um framework leve e pequeno que pode ajudar no seu projeto

## CSS

```css
/* CORES */
.primary
.info
.danger
.success
.warning
.fancy
.grey
.light
.white
.black

.bgPrimary
.bgInfo
.bgDanger
.bgSuccess
.bgWarning
.bgFancy
.bgGrey
.bgLight
.bgWhite
.bgBlack

/* POSIÇÕES */
.center
.right
.left
.hidden
.onCenter
.onRight
.onLeft
.clearer
.clearfix

/* BOXES */
.corner
.paspatur
.panel

/* EFEITOS */
.transition

/* GRID */
.container
.row
.hidden-xs

.col-1
.col-2
(...)
.col-11
.col-12

.col-xs-1 
.col-xs-2 
(...)
.col-xs-11
.col-xs-12

.flexBox
.flexBox.wrap
.flex1
.flex2
(...)
.flex11
.flex12

/* BOTÕES */
button.R4

/* TABLES */
table.R4
```

```html
Exemplo:

<button class="R4 bgSuccess white">Exemplo</button>

<table class="R4">
	<thead>
		<tr>
		(...)
		</tr>
	</tfoot>
</table>
```

### JS
```javascript
//Declare uma função com o nome R4Init no código
//e ela será executada assim que a tela arregar.
const R4Init = () => {
	console.log('Essa linha foi escrita pela função R4Init')
}

//Warning joga mensagens flutuantes na tela.
//Tipo toast em outros frameworks.
Warning.on('Exemplo de warning', 'Linha debaixo');

Effects.slideDown(elem, [callback]);
Effects.slideUp(elem, [callback]);
Effects.fadeIn(elem, [callback, duration, display]);
Effects.fadeOut(elem, [callback, duration]);


```

### CAMPOS
```html
Criar campos é uma mistura de HTML e JS
<div id="prefix_fieldText">Input</div>
<div id="prefix_fieldSelect">Select</div>
<div id="prefix_fieldSwitch">Switch</div>
<div id="prefix_fieldPass">Password</div>
<div id="prefix_fieldButton">Button</div>
```
```javascript
Fields.create([
	{ id: 'fieldText',   type:'text'   },
	{ id: 'fieldSelect', type:'select', options: ['', 'Um', 'Dois', 'Três'] },
	{ id: 'fieldSwitch', type:'switch' },
	{ id: 'fieldPass',   type:'password' },
	{ id: 'fieldButton', type:'button' }
], 'prefix')
```

### DIALOGS
```html
<div id="formDialog" class="hidden" title="Exemplo Dialog Simples">
	Conteúdo do dialog
</div>
```
```javascript
//Jeito rápido
$('#formDialog').dialog('open');

//Jeito completo
Dialog.create({objDeOpcoes});

{objDeOpcoes}.
id
title
html
classes
style
onOpen
onCreate
open
ephemeral
onClose
beforeClose
buttons
```
