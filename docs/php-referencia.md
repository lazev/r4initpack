# Referencia PHP

## R4 (r4.class.php)

Classe estatica com metodos utilitarios usados em todo o framework.

---

### Requisicao e resposta

#### `R4::getRequest($cont = '')`

Retorna os dados da requisicao como array.

```php
$data = R4::getRequest();          // usa $_REQUEST
$data = R4::getRequest($myArray);  // usa array customizado
```

#### `R4::retOkAPI($params = [])`

Retorna resposta JSON de sucesso. Automaticamente:
- Escapa simbolos `<` e `>` para entidades HTML
- Converte strings numericas para numeros
- Adiciona `"ok": 1` ao retorno

```php
R4::retOkAPI();                              // {"ok": 1}
R4::retOkAPI(['id' => 5]);                   // {"id": 5, "ok": 1}
R4::retOkAPI(['list' => $rows, 'total' => 100]);
```

#### `R4::dieAPI($stat = 0, $msg = '', $obs = '', $fields = [])`

Retorna resposta JSON de erro e encerra a execucao.

```php
R4::dieAPI(0, 'Erro ao salvar');
R4::dieAPI(0, 'Campos invalidos', 'Corrija os campos', ['name' => 'Obrigatorio']);
```

Saida:
```json
{"error": 1, "status": "0", "errMsg": "Erro ao salvar", "errObs": "", "errFields": {}}
```

---

### Sessao

#### `R4::setSession($index, $val)`

Define valor na sessao dentro do namespace `SYSTEMID`.

```php
R4::setSession('userId', 42);
R4::setSession('permissions', ['admin', 'editor']);
```

#### `R4::getSession($index)`

Obtem valor da sessao. Retorna `null` se nao existir.

```php
$userId = R4::getSession('userId');    // 42
$name   = R4::getSession('missing');   // null
```

Em modo API (`APION = true`), busca de `$_CONFIG['R4SID']` ao inves de `$_SESSION`.

#### `R4::clearSession()`

Limpa todos os dados da sessao do sistema atual.

```php
R4::clearSession();
```

---

### Log

#### `R4::log($msg, $module = null, $idModule = null, $type = null, $logFile = '')`

Grava entrada no log do sistema.

```php
R4::log('Usuario logado', 'users', $userId, 'INFO');
R4::log('Erro critico', 'vendas', null, 'ERROR', 'custom.log');
```

---

### Validacao

#### `R4::checkDate($date)`

Valida formato de data. Aceita `YYYY-MM-DD` e `YYYY-MM-DD HH:ii:ss`.

```php
R4::checkDate('2024-01-15');            // true
R4::checkDate('2024-01-15 14:30:00');   // true
R4::checkDate('15/01/2024');            // false
```

#### `R4::checkMail($email)`

Valida formato de e-mail.

```php
R4::checkMail('user@email.com');   // true
R4::checkMail('invalido');          // false
```

#### `R4::checkCPF($cpf)`

Valida CPF brasileiro (com ou sem mascara).

```php
R4::checkCPF('123.456.789-09');   // true ou false (verifica digitos)
R4::checkCPF('12345678909');      // funciona tambem sem mascara
```

#### `R4::checkCNPJ($cnpj)`

Valida CNPJ brasileiro.

#### `R4::checkCPFCNPJ($cpfcnpj)`

Valida CPF ou CNPJ automaticamente pela quantidade de digitos.

#### `R4::CPForCNPJ($x)`

Identifica se o valor e CPF ou CNPJ. Retorna `'CPF'`, `'CNPJ'` ou `false`.

---

### Mascaras e formatacao

#### `R4::numberMask($value, $mindec = 2, $maxdec = 2, $ifzero = '0')`

Formata numero no padrao brasileiro.

```php
R4::numberMask(1234.5);      // "1.234,50"
R4::numberMask(1234.567, 2, 4);  // "1.234,567"
R4::numberMask(0);            // "0"
```

#### `R4::numberUnmask($number)`

Converte numero formatado para float.

```php
R4::numberUnmask('1.234,50');   // 1234.50
```

#### `R4::dateMask($date)`

Converte `YYYY-MM-DD` para `DD/MM/YYYY`.

```php
R4::dateMask('2024-01-15');   // "15/01/2024"
```

#### `R4::dateUnmask($date)`

Converte `DD/MM/YYYY` para `YYYY-MM-DD`.

```php
R4::dateUnmask('15/01/2024');   // "2024-01-15"
```

#### `R4::cepMask($cep)`

Formata CEP como `XXXXX-XXX`.

#### `R4::cpfCnpjMask($x)`

Formata CPF como `XXX.XXX.XXX-XX` ou CNPJ como `XX.XXX.XXX/XXXX-XX`.

#### `R4::fileSizeMask($size)`

Converte bytes para formato legivel.

```php
R4::fileSizeMask(1536);       // "1.5 KB"
R4::fileSizeMask(1048576);    // "1 MB"
```

---

### Manipulacao de strings

#### `R4::friendChars($string, $allowStr = '')`

Remove caracteres especiais, mantendo apenas letras, numeros, hifen e underscore.

```php
R4::friendChars('Hello World!');        // "HelloWorld"
R4::friendChars('Hello World!', ' ');   // "Hello World"
```

#### `R4::friendfyName($name)`

Sanitiza string para uso em URLs ou nomes de arquivo.

```php
R4::friendfyName('Produto Especial #1');   // "produto-especial-1"
```

#### `R4::stripAccent($string)`

Remove acentos.

```php
R4::stripAccent('acao');   // "acao"
```

#### `R4::ucase($subject)`

Converte para maiusculas (suporta arrays recursivamente).

#### `R4::onlyNumbers($string)`

Remove tudo exceto numeros.

```php
R4::onlyNumbers('(11) 99999-0000');   // "11999990000"
```

#### `R4::zeroFill($value, $totalsize)`

Preenche com zeros a esquerda.

```php
R4::zeroFill(42, 6);   // "000042"
```

---

### Data e hora

#### `R4::changeDate($date, $year = 0, $month = 0, $day = 0, $hour = 0, $min = 0, $sec = 0)`

Adiciona ou subtrai tempo de uma data.

```php
R4::changeDate('2024-01-15', 0, 0, 7);     // "2024-01-22" (+7 dias)
R4::changeDate('2024-01-15', 1, 0, 0);     // "2025-01-15" (+1 ano)
R4::changeDate('2024-01-15', 0, 0, -5);    // "2024-01-10" (-5 dias)
```

---

### Arrays

#### `R4::intArray($val)`

Converte valor ou string separada por virgulas em array de inteiros.

```php
R4::intArray('1,2,3');      // [1, 2, 3]
R4::intArray([1, '2', 3]);  // [1, 2, 3]
```

#### `R4::mergeNewArr($old, $new)`

Compara arrays antigo e novo, retorna alteracoes.

```php
$result = R4::mergeNewArr(
    ['name' => 'Joao', 'age' => 30],
    ['name' => 'Joao', 'age' => 31]
);
// $result['changed'] = ['age' => 31]
// $result['oldVal']  = ['age' => 30]
// $result['merged']  = ['name' => 'Joao', 'age' => 31]
```

---

### Operacoes recursivas

Todos operam em arrays aninhados:

#### `R4::recursiveNumericCast($subject)`
Converte strings numericas em numeros.

#### `R4::recursiveTagSymbolsReplace($subject)`
Escapa `<` e `>` para entidades HTML.

#### `R4::recursiveStripSlashes($subject)`
Remove barras invertidas.

#### `R4::recursiveStrEscape($subject)`
Escapa caracteres especiais para armazenamento em banco.

---

## DB (db.class.php)

Classe de acesso ao banco de dados MySQL/MariaDB com binding automatico de parametros.

### Conexao

#### `$db->connect($host, $dbname, $user, $pass, $errAlert = true, $ssl = false)`

```php
$db = new DB;
$db->connect('localhost', 'meuBanco', 'root', 'senha');
```

#### `$db->close()`

Fecha a conexao.

---

### Consultas

#### `$db->sql($sqlQuery, $dataFields = [], $errorAlert = true)`

Executa query com binding automatico. Parametros `:nome` sao substituidos pelos valores do array.

```php
// INSERT
$db->sql("INSERT INTO users SET name = :name, email = :email", $_REQUEST);

// UPDATE
$db->sql("UPDATE users SET name = :name WHERE id = :id", ['name' => 'Joao', 'id' => 5]);

// DELETE
$db->sql("DELETE FROM users WHERE id = :id", ['id' => 5]);
```

#### `$db->select($sqlQuery, $dataFields = [], $errorAlert = true)`

Executa SELECT e retorna resultado. Retorna array de linhas, ou uma unica linha se houver apenas um resultado.

```php
// Multiplas linhas
$users = $db->select("SELECT * FROM users WHERE active = :active", ['active' => 1]);
foreach ($users as $user) { ... }

// Uma linha
$user = $db->select("SELECT * FROM users WHERE id = :id", ['id' => 5]);
echo $user['name'];
```

#### `$db->pureSQL($sqlQuery, $dataFields = [], $errorAlert = true)`

Executa query pura com substituicao de parametros nomeados (sem binding preparado).

```php
$db->pureSQL("CREATE TABLE :tableName ...", ['tableName' => 'products']);
```

---

### Resultados

#### `$db->fetchArray($result)`

Obtem proxima linha do resultado.

#### `$db->fetchFieldsName($result)`

Obtem nomes dos campos do resultado.

#### `$db->countRows($result)`

Conta linhas no resultado.

#### `$db->getInsertId()`

Obtem ID do ultimo INSERT.

```php
$db->sql("INSERT INTO users SET name = :name", ['name' => 'Joao']);
$newId = $db->getInsertId();   // ex: 42
```

#### `$db->affectedRows`

Propriedade com numero de linhas afetadas pela ultima query.

---

### Paginacao

#### `$db->getLimit($page, $regs)`

Gera clausula LIMIT para paginacao.

```php
$limit = $db->getLimit(2, 20);   // "LIMIT 20, 20"
$users = $db->select("SELECT * FROM users $limit");
```

---

### Debug

#### `$db->setDebug($bol)`

Ativa modo debug.

```php
$db->setDebug(true);    // exibe queries no output
$db->setDebug('log');   // salva queries no log
```

---

### Informacoes da conexao

```php
$db->getCurrentUser();    // usuario conectado
$db->getCurrentHost();    // host da conexao
$db->getCurrentBase();    // nome do banco
$db->getCurrentConfig();  // array completo da configuracao
```

---

### Tratamento de erros

```php
$db->errCod;   // codigo do erro
$db->errMsg;   // mensagem do erro
$db->errCom;   // query que causou o erro
```

#### `$db->dieAPI($safePublicMsg)`

Retorna erro como JSON. Em modo DEV mostra detalhes, em producao mostra mensagem segura.

---

## ValidFields (validFields.class.php)

Validacao de dados baseada em schema JSON.

### Uso basico

```php
$valid = new ValidFields;
$valid->addSchema('fields.json');

if (!$valid->valid($_REQUEST)) {
    R4::dieAPI(0, $valid->errMsg, $valid->errObs, $valid->errFields);
}
```

### Metodos

#### `$valid->addSchema($fieldsFile, $prefix = '')`

Carrega definicoes de campos de um arquivo JSON. O parametro `$prefix` filtra campos por prefixo.

```php
$valid->addSchema('fields.json');             // todos os campos
$valid->addSchema('fields.json', 'billing');  // apenas campos com prefixo 'billing'
```

#### `$valid->valid($arrData)`

Valida array de dados contra o schema. Retorna `true` ou `false`.

```php
if (!$valid->valid($_REQUEST)) {
    echo $valid->errMsg;       // mensagem geral
    echo $valid->errObs;       // observacao
    print_r($valid->errFields); // erros por campo
}
```

#### `$valid->setError($field, $errorMsg)`

Adiciona erro manualmente a um campo.

```php
$valid->setError('email', 'Este e-mail ja esta cadastrado');
```

#### `$valid->getValidateErrors()`

Retorna todos os erros de validacao.

#### `$valid->setErrorMap($arrErrors)`

Customiza mensagens de erro.

```php
$valid->setErrorMap([
    'required' => 'Este campo e obrigatorio',
    'minSize'  => 'Minimo de %s caracteres',
    'maxSize'  => 'Maximo de %s caracteres'
]);
```

### Tipos de validacao

| Tipo | Descricao |
|---|---|
| `integer` | Numero inteiro (positivo) |
| `integer-` | Numero inteiro (permite negativo) |
| `decimal` | Numero decimal (positivo) |
| `decimal-` | Numero decimal (permite negativo) |
| `money` | Valor monetario (positivo) |
| `money-` | Valor monetario (permite negativo) |
| `date` | Data no formato YYYY-MM-DD |
| `cpf` | CPF valido |
| `cnpj` | CNPJ valido |
| `cpfcnpj` | CPF ou CNPJ valido |

### Atributos do campo no schema

| Atributo | Descricao |
|---|---|
| `id` | Identificador do campo |
| `type` | Tipo de validacao |
| `required` / `require` | Campo obrigatorio |
| `minSize` | Tamanho minimo |
| `maxSize` | Tamanho maximo |
| `exactSize` | Tamanho exato |
| `regex` | Expressao regular customizada |

---

## Security (security.class.php)

Geracao e validacao de chaves criptograficas.

#### `$sec->setPassKey($passKey)`

Define a chave de passphrase.

#### `$sec->generateKey($cod, $id, $passkey = '')`

Gera chave criptografada em base64.

```php
$sec = new Security;
$sec->setPassKey('minhaChaveSecreta');
$key = $sec->generateKey(1, 42);   // chave base64
```

#### `$sec->extractKey($key64, $passkey = '')`

Extrai e valida chave. Retorna array com `cod` e `id`, ou `false` se invalida.

```php
$data = $sec->extractKey($key64);
if ($data) {
    echo $data['cod'];   // 1
    echo $data['id'];    // 42
}
```

---

## Logger (logger.class.php)

Sistema de logs em arquivo.

### Propriedades

| Propriedade | Padrao | Descricao |
|---|---|---|
| `dirPath` | `/var/log/r4/SYSTEMID/` | Diretorio dos logs |
| `logFile` | `reg.log` | Nome do arquivo |
| `type` | `INFO` | Tipo padrao |
| `module` | `null` | Nome do modulo |
| `idModule` | `null` | ID da instancia |

### Metodos

#### `$log->log($msg, $module, $idModule, $type)`

Grava entrada no log.

```php
$log = new Logger;
$log->log('Operacao realizada', 'vendas', 123, 'INFO');
```

Formato da saida:
```
2024-01-15 14:30:22|vendas|123|INFO|Operacao realizada
```

Ou use o atalho:
```php
R4::log('Mensagem', 'modulo', $id, 'ERROR');
```
