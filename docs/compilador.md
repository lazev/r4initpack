# Compilador

O sistema de build do R4 processa os arquivos de `src/` e gera a pasta `public/` pronta para producao.

---

## Comandos

### Compilacao unica

```bash
../r4/r4 up
```

### Modo monitor (desenvolvimento)

```bash
../r4/r4 up monitor
```

Monitora alteracoes nos arquivos e recompila automaticamente. O intervalo de verificacao e de alguns segundos, com debounce para evitar multiplas compilacoes simultaneas.

### Inicializar projeto

```bash
../r4/r4 init
```

### Criar modulo

```bash
../r4/r4 initmodule nomeDoModulo
```

---

## Configuracao (r4.json)

O arquivo `r4.json` na raiz do projeto controla o comportamento do compilador:

```json
{
    "R4JSPacker": 1,
    "R4CSSPacker": 1,
    "JSPacker": 0,
    "HTMLPacker": 0,
    "CSSPacker": 0,

    "foldersToMonitor": [
        "./src",
        "./vendor"
    ],

    "concatFiles": {}
}
```

### Opcoes de minificacao

| Opcao | Descricao |
|---|---|
| `R4JSPacker` | Minifica e ofusca os arquivos JS do framework R4 |
| `R4CSSPacker` | Minifica os arquivos CSS do framework R4 |
| `JSPacker` | Minifica os arquivos JS do projeto |
| `CSSPacker` | Minifica os arquivos CSS do projeto |
| `HTMLPacker` | Minifica os arquivos HTML do projeto |

Valores: `1` = ativado, `0` = desativado.

Para desenvolvimento, recomenda-se desativar `JSPacker`, `CSSPacker` e `HTMLPacker` para facilitar o debug. Para producao, ative todos.

### Pastas monitoradas

O array `foldersToMonitor` define quais pastas o modo monitor observa. Pastas ocultas (iniciando com `.`) sao ignoradas automaticamente.

### Concatenacao de arquivos

O objeto `concatFiles` permite unir multiplos arquivos em um so:

```json
{
    "concatFiles": {
        "./src/_assets/js/libs.js": [
            "./vendor/js/lib1.js",
            "./vendor/js/lib2.js",
            "./src/_assets/js/helpers/*.js"
        ],
        "./src/_assets/css/vendor.css": [
            "./vendor/css/*.css"
        ]
    }
}
```

A chave e o arquivo de destino e o valor e um array de origens. Suporta glob (`*.js`).

---

## Etapas da compilacao

### 1. Limpeza e copia

- Remove o conteudo de `public/`
- Copia todos os arquivos de `src/` para `public/`
- Copia os assets do R4 (JS, CSS, PHP) para `public/_assets/`

### 2. Templater

Processa templates HTML em duas etapas:

#### Templates globais

Definidos em `src/_assets/templates/templates.html`:

```html
<!--R4TEMPLATE-head-->
<meta charset="utf-8">
<meta http-equiv="Content-Language" content="pt-br">
<meta name="viewport" content="width=device-width, initial-scale=1">
<link rel="stylesheet" href="_assets/css/r4.css">
<!--/R4TEMPLATE-->

<!--R4TEMPLATE-scripts-->
<script src="_assets/js/r4.js"></script>
<!--/R4TEMPLATE-->
```

Em qualquer arquivo `.html`, o marcador `<!--R4TEMPLATE-head-->` sera substituido pelo conteudo do bloco correspondente.

#### Templates de modulo

Cada modulo pode ter sua pasta `templates/`. Os arquivos HTML dentro dela sao automaticamente injetados no `index.html` do modulo como blocos de template.

#### Cache busting

O marcador `R4Cache::` adiciona timestamp aos caminhos de arquivos:

```html
<!-- Antes da compilacao -->
<link rel="stylesheet" href="R4Cache::_assets/css/estilo.css">
<script src="R4Cache::_assets/js/app.js"></script>

<!-- Depois da compilacao -->
<link rel="stylesheet" href="_assets/css/estilo.css?1713350400">
<script src="_assets/js/app.js?1713350400"></script>
```

Isso forca o navegador a recarregar o arquivo quando ele for alterado.

### 3. Packer (minificacao)

#### JavaScript

Quando `R4JSPacker` esta ativo:
1. Todos os arquivos JS do R4 (`js/*.class.js`) sao unidos em um unico `r4.js`
2. Os arquivos em `_assets/js/global/*.js` sao concatenados ao final
3. O resultado e minificado e ofuscado

Quando `JSPacker` esta ativo:
1. Arquivos `.class.js` dos modulos sao minificados individualmente

#### CSS

Quando `R4CSSPacker` esta ativo:
1. Todos os arquivos CSS do R4 (`css/*.css`) sao unidos em um unico `r4.css`
2. Os arquivos em `_assets/css/global/*.css` sao concatenados ao final
3. O resultado e minificado

Quando `CSSPacker` esta ativo:
1. Arquivos CSS dos modulos sao minificados individualmente

#### HTML

Quando `HTMLPacker` esta ativo:
1. Remove comentarios HTML
2. Remove espacos em branco desnecessarios
3. Minifica o HTML

### 4. Concatenacao

Processa as regras definidas em `concatFiles`, unindo os arquivos na ordem especificada.

---

## Pasta global/

Uma caracteristica importante do compilador: arquivos colocados nas pastas `global/` sao automaticamente incluidos no bundle do framework.

### JavaScript global

Arquivos em `src/_assets/js/global/` sao concatenados com os JS do R4 e incluidos no `r4.js` final. Nao precisam de `<script>` no HTML.

Exemplo de uso: um arquivo `basico.class.js` com funcoes utilitarias do projeto que estarao disponiveis em todas as paginas.

### CSS global

Arquivos em `src/_assets/css/global/` sao concatenados com os CSS do R4 e incluidos no `r4.css` final. Nao precisam de `<link>` no HTML.

Exemplo de uso: um arquivo `estrutura.css` com o layout base do projeto.

---

## Estrutura de saida

Apos a compilacao, a pasta `public/` tera:

```
public/
  _assets/
    css/
      r4.css              CSS do framework + global/ (minificado)
      global/             CSS global do projeto
    js/
      r4.js               JS do framework + global/ (minificado + ofuscado)
      global/             JS global do projeto
    php/
      r4.class.php        Classes PHP do framework
      db.class.php
      security.class.php
      ...
    icons/                Icones e favicon
    templates/            Templates (ja processados)
  users/
    users.class.js        JS do modulo (minificado se JSPacker ativo)
    ajax.php              Endpoint AJAX
    index.html            HTML com templates injetados
    ...
  index.html              Pagina principal
  manifest.json           PWA manifest
  sworker.js              Service Worker
```

---

## Gerenciamento de processos

O modo monitor cria um arquivo de lock para evitar multiplas instancias. Se o compilador travar, pode ser necessario encerrar o processo manualmente:

```bash
# Linux
kill $(pgrep -f "compiler.php")

# Ou simplesmente Ctrl+C no terminal
```

---

## Dicas

1. **Desenvolvimento**: Desative `JSPacker`, `CSSPacker` e `HTMLPacker` para ver o codigo original no browser
2. **Producao**: Ative todas as opcoes para melhor performance
3. **Novos assets globais**: Coloque em `_assets/js/global/` ou `_assets/css/global/` para inclusao automatica
4. **Cache**: Use `R4Cache::` nos caminhos de arquivos para evitar cache do navegador
5. **Templates**: Centralize HTML repetido em `templates.html` para manter consistencia
