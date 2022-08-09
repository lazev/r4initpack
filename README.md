# R4 Framework com initPack

PHP, JS e CSS de um framework leve e pequeno que pode ajudar no seu projeto

## Pré instalação (no Windows)

Antes de instalar, é importante que o comando **php** seja acessável a partir de qualquer pasta. Para isto, coloque a pasta do executável do PHP dentro do PATH do Windows (google it). Caso seja do interesse usar o banco de dados (MariaDB ou MySQL), o comando **mysql** também precisa estar no PATH.

## Instalação

Dentro da pasta raíz dos projetos do apache/nginx

```
git clone https://github.com/lazev/r4initpack r4
```

### No Linux ou Windows

Crie a pasta do seu projeto:

```
mkdir novoProjeto
cd novoProjeto
```

Rode o inicializador do framework dentro do novo projeto:
```
../r4/r4 init
```

O instalador irá perguntar:
* O nome do projeto (a sugestão é o próprio nome da pasta)
* O usuário do banco de dados
* A senha do banco de dados
* Se deseja instalar as bases modelo no banco de dados
* Se deseja instalar o Composer

No Linux vai pedir a senha de root para mudar o arquivo que contém a senha do banco de dados para a pasta /etc/

No Windows vai sugerir colocar este arquivo em alguma pasta segura

Por fim, o instalador faz uma "_compilação_" do código modelo.


## Estrutura básica

A estrutura básica de um projeto do sistema é formado por 3 pastas e 1 arquivo:
```
r4.json - Arquivo que determina o que o compilador vai executar.
src/    - Pasta onde o programador vai trabalhar. O código-fonte vai aqui.
public/ - Pasta onde o "compilador" vai colocar o código depois de processado.
vendor/ - Scripts de terceiros são instalados e organizados aqui via Composer.
```

## Estrutura operacional

### src/

A estrutura sugerida é por módulos. Ou seja, cada módulo do sistema terá sua própria pasta dentro de src/.

#### Exemplo

Um sistema com cadastro de produtos, clientes, tela de vendas e configurações poderia ser estruturado assim:

```
src/
» clientes/
» config/
» produtos/
» vendas/
» _assets/
```

O Init Pack provê uma pasta chamada **users/** com a estrutura sugerida dos arquivos.

### _assets/

Dentro da pasta **src/** há também a pasta **_assets/**.
Esta pasta serve pra receber arquivos auxiliares do projeto (css/, js/, php/, templates/).
Esta pasta também recebe os arquivos do próprio framework na "_compilação_".

As pastas **css/** e **js/** possuem uma subpasta chamada global/. Os arquivos colocados dentro desta pasta não precisam ser incluídos no HTML porque serão agrupados dentro do script minimizado do framework.


## Compilador

O Framework é formado por scripts PHP, JS, CSS e HTML. Nada disso é compilável, eu sei. Então, como assim compilador?

O framework chama de _compilar_ o ato de:
* Minimizar, unir e ofuscar (no caso de javascript) os arquivos, diminuindo assim o número de requisições (handshakes) e o tamanho dos arquivos acessados.
* Espalhar os templates definidos no arquivo **src/_assets/templates/templates.html** em todo o sistema nos arquivos .html que possuem o comentário que vincula o respectivo template.
* _Validar a estrutura dos arquivos JS e PHP_ **(a fazer)**
* Limpar e recriar toda a pasta **public/** com os arquivos prontos.

Para rodar o _compilador_ basta executar o seguinte comando na pasta raíz do projeto
```
../r4/r4 up
```

Mas não precisa digitar o comando cada vez que altera um arquivo. Isto pode ser feito de forma automática com o seguinte comando:
```
../r4/r4 up monitor
```

Este comando irá monitorar a alteração de arquivos dentro das pastas definidas em **r4.json**.

## Templates

Uma das características do framework é dispensar a necessidade de colocar HTML e PHP no mesmo arquivo. Um grande empecilho a isto é a quantidade de códigos que precisariam ser replicados em diversos módulos. Pra resolver esta questão, o framework possui uma ferramenta de templates. Funciona assim:

Dentro de **src/_assets/templates/templates.html** pode conter diversos templates separados neste formato:
```html
<!--R4TEMPLATE-head-->
<meta charset="utf-8">
<meta http-equiv="Content-Language" content="pt-br">
<!--/R4TEMPLATE-->
```

Já nos arquivos .html basta adicionar o seguinte comentário: `<!--R4TEMPLATE-head-->`. No momento que rodar o compilador, este comentário será transformado no bloco de código que está dentro dos templates.html.

## Exemplos

Há um guia de consulta rápida chamado **example.html** dentro da pasta **src/** com algumas das principais ferramentas do framework.
