# Fields multiselect

Combo com lista de checkboxes, sem dependência externa. Opt-in: não altera selects existentes.

```js
await Fields.create({
  id: 'locais', type: 'multiselect',
  options: [{key: 1, value: 'Centro'}, {key: 2, value: 'Shopping'}],
  value: '*', countLabel: 'locais'
});
Fields.getVal(document.getElementById('locais')); // ['1', '2']
Fields.getText(document.getElementById('locais')); // 'Todos'
Fields.setVal(document.getElementById('locais'), ['1']);
Fields.setSelectOpts(document.getElementById('locais'), novasOpcoes);
```

`value: '*'` seleciona todas as opções. Um array seleciona exatamente as chaves informadas; `[]` não seleciona nenhuma. As chaves devem ser únicas. Os valores retornados são strings, não um código especial para Todos. Nunca interpretar `[]` como acesso a todos no servidor.

Resumo: todos = `allLabel` (padrão Todos), um = texto da opção, parcial = quantidade + `countLabel` (padrão selecionados), nenhum = `emptyLabel` (padrão Nenhum). `FieldsMultiSelect.isAll(campo)` informa se todos estão selecionados.

As alterações ficam pendentes enquanto a lista está aberta. Aplicar ou clicar fora confirma; Cancelar/Escape restaura a seleção anterior. Um único evento `change` é emitido no select de armazenamento após a confirmação, somente se a seleção mudou. Os checkboxes aceitam Tab/Espaço; a seta para baixo no combo abre a lista. A lista tem rolagem e se posiciona acima quando faltar espaço abaixo.

`Fields.setSelectOpts` preserva a seleção: todos continuam todos; seleção parcial mantém apenas as chaves ainda existentes. Não emite change. `Fields.setVal` também não emite change; o consumidor pode dispará-lo quando necessário. Alterar `campo.disabled` também desabilita o botão. Existe um select multiple oculto para armazenar o estado; use os métodos Fields em vez de atribuir `campo.value` diretamente.

O controle segue os campos R4 e a variação formCompact. A lista é colocada no body para não ser cortada por containers com overflow. O chamador continua responsável por validar chaves, permissões e escopo no servidor. Para APIs que não serializam arrays aninhados, envie JSON explicitamente.
