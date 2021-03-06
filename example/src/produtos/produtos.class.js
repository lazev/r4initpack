//Nome da classe igual ao nome do módulo, com letra maiúscula
const Produtos = {

	//Parâmetro que identifica o produto que está sendo editado no momento
	//No momento de salvar a edição, esse id identifica que é pra atualizar
	//Se for zero, ele vai gravar um novo produto
	idProduto: 0,


	//Define os caminhos de arquivos externos usados pelo módulo
	pathAjax:   _CONFIG.rootURL +'produtos/ajax.php',
	pathFields: _CONFIG.rootURL +'produtos/fields.json',
	pathForm:   _CONFIG.rootURL +'produtos/templates/formProdutos.html',
	pathCSS:    _CONFIG.rootURL +'produtos/style.css',


	//Usada pra incorporar todo o módulo dentro de outra tela
	//Nesse caso, o HTML não pode ter os cabeçalhos e rodapés
	incorporar: () => {
		R4.setRemoteHTML($('#moduloProdutos'), Produtos.pathView);
		R4.importCSS(Produtos.pathCSS);
		Produtos.init();
	},


	//Roda as funções de inicialização do módulo
	init: callback => {

		Produtos.getInit(() => {
			Produtos.initFilter();

			Produtos.initForm();

			Produtos.initList();

			if(typeof callback == 'function') callback();
		});
	},


	//Função comum em todos os módulos (mesmo que não seja usada)
	//Ela busca dados essenciais pro funcionamento do módulo.
	//Por exemplo, pode buscar uma lista de situações ou categorias
	//pra guardar na memória ao carregar a tela.
	getInit: callback => {

		R4.getJSON(Produtos.pathAjax, {com: 'getInit'})

		.then(ret => {
			Produtos.listaCores = ret.listaCores;

			if(typeof callback == 'function') callback();
		})

		.catch(err => {
			Warning.show('Erro ao buscar os dados iniciais', err);
			reject(err);
		});
	},


	//Inicia os filtros da tela
	initFilter: () => {
		Fields.create([
			{ id:'busca', type: 'text'   },
			{ id:'btn',   type: 'submit', classes: 'bgInfo' }
		], 'filtro');


		$('#filtroProdutos').on('submit', function(ev) {
			ev.preventDefault();
			Produtos.filter();
		});
	},


	//Inicia o formulário, criando uma dialog
	//com o HTML encontrado dentro da pasta
	//templates aqui dentro do próprio módulo
	//mas o HTML poderia também estar direto
	//no index.html
	initForm: () => {

		//A função dialog usa o HTML encontrado
		//dentro do div #formProdutos e adiciona
		//botões com eventos
		Dialog.create({
			elem: $('#formProdutos'),
			title: 'Dados do produto',
			buttons: [
				{
					label: 'Salvar',
					classes: 'bgSuccess white',
					onClick: function(ev) {
						Produtos.save();
					}
				},
				//O evento do botão fechar é definido
				//automático pela classe R4DialogCloser
				{
					label: 'Fechar',
					classes: 'R4DialogCloser'
				}
			]
		});

		//Inicia os campos, com base no HTML e no arquivo JSON
		//que contém as definições dos campos.
		//O segundo parêmtro (prod) dessa função indica o prefixo
		//usado em todos os campos do módulo.
		//Esse prefixo é importante pra evitar conflito com
		//outros módulos, no caso de chamar um dentro do outro
		Fields.createFromFile(Produtos.pathFields, 'prod');
	},


	//Inicia o elemento da listagem. Neste ponto apenas a matriz
	//do cabeçalho é definida. Os dados da lista são gerados por
	//ajax ao carregar a página
	initList: () => {

		//orderBy gera os eventos de ordenação a partir do clique
		//no cabeçalho. O type indica a formatação do dado
		Table.create({
			idDestiny:    'listaProdutos',
			classes:      'striped',
			arrHead:      [
				{ label: 'Cod',   orderBy: 'id' },
				{ label: 'Nome',  orderBy: 'nome' },
				{ label: 'Preco', orderBy: 'preco', type: 'decimal', precision: 2 }
			],
			withCheck:    true,
			onLineClick:  value => { Produtos.edit(value);   },
			onOrderBy:    value => { Produtos.filter(); },
			onPagination: value => { Produtos.filter(); },
			onRegPerPage: value => { Produtos.filter(); }
		});
	},


	//Função que zera o id e limpa o form,
	//que pode estar preenchido com dados de
	//algum produto editado anteriormente
	insert: () => {
		Produtos.idProduto = 0;

		Fields.reset($('#formProdutos'));

		Dialog.open($('#formProdutos'));
	},


	//A edição de um registro busca os dados
	//por ajax, preenche os campos e abre o form
	edit: idProduto => {
		if(!idProduto) return;

		R4.blockScreen(true);

		R4.getJSON(Produtos.pathAjax, {
			com: 'read',
			idProduto: idProduto
		})

		.then(ret => {
			R4.blockScreen(false);

			Produtos.idProduto = ret.produto.id;

			$('#prod_nome').val(       ret.produto.nome       );
			$('#prod_categoria').val(  ret.produto.categoria  );
			$('#prod_preco').val(      ret.produto.preco      );
			$('#prod_comEstoque').val( ret.produto.comEstoque );
			$('#prod_tags').val(       ret.produto.tags       );

			Dialog.open($('#formProdutos'));
		})

		.catch(err => {
			R4.blockScreen(false);

			Warning.show('Erro ao buscar os dados do produto');
			console.log(err);
		})
	},


	//A função salvar é usada tanto pra inserir
	//quanto pra atualizar. A diferença é estar
	//definido o código em Produtos.idProduto
	save: () => {

		R4.blockScreen(true);

		R4.getJSON(Produtos.pathAjax, {
			com:        'save',
			idProduto:  Produtos.idProduto,
			nome:       $('#prod_nome').val(),
			categoria:  $('#prod_categoria').val(),
			preco:      $('#prod_preco').val(),
			comEstoque: $('#prod_comEstoque').val(),
			tags:       $('#prod_tags').val()
		})

		//.then é a função de retorno Ok
		.then(ret => {
			R4.blockScreen(false);

			let btn = $new('<button type="button" class="R4">Detalhar</button>');
			btn.on('click', function(ev) {
				ev.preventDefault();
				Produtos.edit(ret.produto.id);
			});

			//Função que faz pular na tela um aviso
			Warning.show('Produto '+ ret.produto.id +' salvo com sucesso', btn);

			//Após salvar, roda a função definida.
			//Dentro do próprio módulo, a função padrão
			//é a de listar, para que as alterações
			//já apareçam na lista
			Produtos.onSave();

			Dialog.close($('#formProdutos'));
		})

		//.catch é a função de retorno com erro
		.catch(err => {
			R4.blockScreen(false);

			Produtos.onSaveError(err);
		})
	},


	onSave: id => {
		Produtos.list();
	},


	onSaveError: err => {
		Fields.setErrFields(err, 'prod');
		console.log(err);
	},


	//Função de apagar um ou mais registro
	delete: id => {

		//Se o id informado é o da lista, a ferramenta
		//busca todos os checkboxes selecionados naquela
		//lista. Se o id for um número, ele tenta apagar
		//o id informado.
		let ids = (isNaN(id)) ? Table.getAllSel(id) : id;

		if(!ids.length) {
			Warning.show('Nenhum código informado para exclusão');
			return;
		}

		R4.getJSON(Produtos.pathAjax, {
			com: 'delete',
			ids: ids
		})

		.then(ret => {
			if(ret.deleted.length) {

				//Ao confirmar a exclusão, o sistema mostra no aviso
				//um botão de desfazer a exclusão
				let btn = $new('<button type="button" class="R4">Desfazer</button>');
				btn.on('click', function(ev){
					ev.preventDefault();
					Produtos.undel(ret.deleted.join(','));
				});

				Warning.show('Itens excluidos: '+ ret.deleted.join(', '), btn);

				Produtos.list();
			}

			if(ret.alert) {
				let k;
				for(k in ret.alert) {
					Warning.show('Erro na exclusão do item '+ k, ret.alert[k]);
				}
			}
		});
	},


	//Função de desfazer a exclusão.
	//Ela recebe os ids excluídos
	undel: ids => {

		if(!ids.length) {
			Warning.show('Nenhum código informado para recuperação');
			return;
		}

		R4.getJSON(Produtos.pathAjax, {
			com: 'undel',
			ids: ids
		})

		.then(ret => {
			if(ret.recovered.length) {
				Warning.show('Itens recuperados: '+ ret.recovered.join(', '));
				Produtos.list();
			}

			if(ret.alert) {
				let k;
				for(k in ret.alert) {
					Warning.show('Erro na recuperação do item '+ k, ret.alert[k]);
				}
			}
		});
	},


	//Quando há uma mudança nos filtros, tem que chamar
	//essa função e ela chama a que lista. Se for só pra
	//atualizar a lista, é só chamar direto a .list
	filter: () => {
		Produtos.list({
			listParams: Table.getInfo($('#listaProdutos')),
			listFilter: Fields.objectize($('#filtroProdutos'))
		});
	},


	//Função que puxa dados por ajax e preenche no
	//body e foot da table.
	list: arrFilter => {

		if(!arrFilter) arrFilter = {};

		R4.getJSON(Produtos.pathAjax, {
			com: 'list',
			listParams: arrFilter.listParams,
			listFilter: arrFilter.listFilter
		})

		.then(ret => {
			let goodVal = '';
			let check   = '';
			let body    = [];
			let foot    = [];
			let destiny = $('#listaProdutos');
			let vTotal  = 0.00;

			Table.setInfo(destiny, ret.info);

			if(!ret.list.length) {
				Table.clearBody(destiny);
				return;
			}

			ret.list.forEach(item => {
				//goodVal é só pra mostrar um exemplo de
				//classe diferente com alguma condição.
				//Nesse caso ela aplica a classe success,
				//que deixa a letra verde, quando o preço
				//for maior que 20
				goodVal = (item.preco > 20) ? 'success' : '';

				body.push({
					value: item.id,
					cells: [item.id, item.nome, item.preco ],
					//Cada coluna tem sua própria classe (opcional)
					classes: [
						'nonClickCol',
						'',
						goodVal
					]
				});

				vTotal += parseFloat(item.preco);
			});

			foot.push({
				cells: [
					'',
					'TOTAL LISTADO',
					R4.round(vTotal, 2)
				]
			});

			//Depois de preparar os dados de body e foot,
			//é só atualizar o conteúdo da table
			Table.updateContent(destiny, body, foot);
		})

		.catch(err => {
			console.log(err);
			Warning.show('Erro', err);
		})
	},


	//Usado pra outros módulos importarem o form desse módulo
	importForm: () => {

		R4.getHTML(Produtos.pathForm)

		.then(html => {

			let div = $new(html);

			$('body').append(div);

			R4.importCSS(Produtos.pathCSS);

			Produtos.getInit(() => {
				Produtos.initForm();
				Produtos.onSave = function(){};
			});

			resolve();
		})

		.catch(err => {
			reject(err);
		});
	}
};