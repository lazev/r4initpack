//Nome da classe igual ao nome do módulo, com letra maiúscula
const Produtos = {

	//Parâmetro que identifica o produto que está sendo editado no momento
	//No momento de salvar a edição, esse id identifica que é pra atualizar
	//Se for zero, ele vai gravar um novo produto
	idProduto: 0,


	//Define os caminhos de arquivos externos usados pelo módulo
	setPaths: () => {
		Produtos.pathAjax   = _CONFIG.rootURL +'produtos/ajax.php';
		Produtos.pathFields = _CONFIG.rootURL +'produtos/fields.json';
		Produtos.pathForm   = _CONFIG.rootURL +'produtos/templates/formProdutos.html';
		Produtos.pathCSS    = _CONFIG.rootURL +'produtos/style.css';
	},


	//Usada pra incorporar todo o módulo dentro de outra tela
	//Nesse caso, o HTML não pode ter os cabeçalhos e rodapés
	incorporar: () => {
		console.log('incorporou');
		Produtos.setPaths();
		$('#moduloProdutos').setRemoteHTML(Produtos.pathView);
		R4.importCSS(Produtos.pathCSS);
		Produtos.init();
		console.log('iniciou');
	},


	//Roda as funções de inicialização do módulo
	init: () => {
		return new Promise((resolve, reject) => {

			Produtos.setPaths();
			Produtos.getInit()
			.then(res => {
				Produtos.initForm();
				Produtos.initList();
				resolve();
			})
			.catch(err => {
				reject(err);
			});

		});
	},


	//Função comum em todos os módulos (mesmo que não seja usada)
	//Ela busca dados essenciais pro funcionamento do módulo.
	//Por exemplo, pode buscar uma lista de situações ou categorias
	//pra guardar na memória ao carregar a tela.
	getInit: () => {
		return new Promise((resolve, reject) => {
			let params = {
				com: 'getInit'
			};
			R4.getJSON(Produtos.pathAjax, params)
			.then(ret => {
				Produtos.listaCores = ret.listaCores;
				resolve();
			})
			.catch(err => {
				Warning.on('Erro ao buscar os dados iniciais', err);
				reject(err);
			});
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
		$('#formProdutos').dialog({
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
		let head = [
			{ label: 'Cod',   orderBy: 'id' },
			{ label: 'Nome',  orderBy: 'nome' },
			{ label: 'Preco', orderBy: 'preco', type: 'decimal' }
		];

		Table.create({
			idDestiny:    'listaProdutos',
			classes:      'striped',
			arrHead:      head,
			withCheck:    true,
			onLineClick:  value => { Produtos.edit(value);   },
			onOrderBy:    value => { Produtos.filter(value); },
			onPagination: value => { Produtos.filter(value); },
			onRegPerPage: value => { Produtos.filter(value); }
		});
	},


	//Função que zera o id e limpa o form,
	//que pode estar preenchido com dados de
	//algum produto editado anteriormente
	insert: () => {
		Produtos.idProduto = 0;

		$('#formProdutos').reset();

		$('#formProdutos').dialog('open');
	},


	//A edição de um registro busca os dados
	//por ajax, preenche os campos e abre o form
	edit: id => {
		if(!id) return;

		let params = {
			com: 'read',
			idProduto: id
		};

		R4.getJSON(Produtos.pathAjax, params)
		.then(ret => {
			Produtos.idProduto = ret.produto.id;

			$('#prod_nome').val(       ret.produto.nome       );
			$('#prod_categoria').val(  ret.produto.categoria  );
			$('#prod_preco').val(      ret.produto.preco      );
			$('#prod_comEstoque').val( ret.produto.comEstoque );
			$('#prod_tags').val(       ret.produto.tags       );

			$('#formProdutos').dialog('open');
		})
	},


	//A função salvar é usada tanto pra inserir
	//quanto pra atualizar. A diferença é estar
	//definido o código em Produtos.idProduto
	save: idProduto => {

		let params = {
			com:        'save',
			idProduto: Produtos.idProduto,
			nome:       $('#prod_nome').val(),
			categoria:  $('#prod_categoria').val(),
			preco:      $('#prod_preco').val(),
			comEstoque: $('#prod_comEstoque').val(),
			tags:       $('#prod_tags').val()
		};

		R4.getJSON(Produtos.pathAjax, params)

		//.then é a função de retorno Ok
		.then(ret => {

			//Bloco de código que cria um botão
			//onde o evento é de voltar a detalhar
			//o produto que acabou de ser salvo
			let btn = document.createElement('button');
			btn.setAttribute('type', 'button');
			btn.classList.add('R4');
			btn.innerHTML = 'Detalhar';
			btn.addEventListener('click', ev => {
				ev.preventDefault();
				Produtos.edit(ret.produto.id);
			});

			//Função que faz pular na tela um aviso
			Warning.on(
				'Produto '+ ret.produto.id +' salvo com sucesso',
				btn
			);

			//Após salvar, roda a função definida.
			//Dentro do próprio módulo, a função padrão
			//é a de listar, para que as alterações
			//já apareçam na lista
			Produtos.onSave();

			$('#formProdutos').dialog('close');

		})

		//.catch é a função de retorno com erro
		.catch(err => {
			Warning.on('Erro ao salvar o produto');
			console.log(err);
		})
	},


	onSave: id => {
		Produtos.list();
	},


	//Função de apagar um ou mais registro
	delete: id => {

		//Se o id informado é o da lista, a ferramenta
		//busca todos os checkboxes selecionados naquela
		//lista. Se o id for um número, ele tenta apagar
		//o id informado.
		let ids = (isNaN(id)) ? Table.getAllSel(id) : id;

		if(!ids.length) {
			Warning.on('Nenhum código informado para exclusão');
			return;
		}

		let params = {
			com: 'delete',
			ids: ids
		}

		R4.getJSON(Produtos.pathAjax, params)

		.then(ret => {
			if(ret.deleted.length) {


				//Ao confirmar a exclusão, o sistema mostra no aviso
				//um botão de desfazer a exclusão
				let btn = document.createElement('button');
				btn.setAttribute('type', 'button');
				btn.classList.add('R4');
				btn.innerHTML = 'Desfazer';
				btn.addEventListener('click', ev => {
					ev.preventDefault();
					Produtos.undel(ret.deleted.join(','));
				});

				Warning.on(
					'Itens excluidos: '+ ret.deleted.join(', '),
					btn
				);

				Produtos.list();
			}

			if(ret.alert) {
				let k;
				for(k in ret.alert) {
					Warning.on('Erro na exclusão do item '+ k, ret.alert[k]);
				}
			}
		});
	},


	//Função de desfazer a exclusão.
	//Ela recebe os ids excluídos
	undel: ids => {

		if(!ids.length) {
			Warning.on('Nenhum código informado para recuperação');
			return;
		}

		let params = {
			com: 'undel',
			ids: ids
		}

		R4.getJSON(Produtos.pathAjax, params)

		.then(ret => {
			if(ret.recovered.length) {
				Warning.on('Itens recuperados: '+ ret.recovered.join(', '));
				Produtos.list();
			}

			if(ret.alert) {
				let k;
				for(k in ret.alert) {
					Warning.on('Erro na recuperação do item '+ k, ret.alert[k]);
				}
			}
		});
	},


	//Quando há uma mudança nos filtros, tem que chamar
	//essa função e ela chama a que lista. Se for só pra
	//atualizar a lista, é só chamar direto a .list
	filter: () => {
		let filter = {};

		//PEDRINHA: Click no onRegPerPage não tá funcionando

		Produtos.list({
			listParams: Table.getInfo($('#listaProdutos')),
			listFilter: filter
		});
	},


	//Função que puxa dados por ajax e preenche no
	//body e foot da table.
	list: arrFilter => {

		if(!arrFilter) arrFilter = {};

		let params = {
			com: 'list',
			listParams: arrFilter.listParams,
			listFilter: arrFilter.listFilter
		};

		R4.getJSON(Produtos.pathAjax, params)
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
					'TOTAL',
					R4.round(vTotal, 2)
				]
			});


			//Depois de preparar os dados de body e foot,
			//é só atualizar o conteúdo da table
			Table.updateContent(destiny, body, foot);

		})
		.catch(err => {
			console.log(err);
			Warning.on('Erro', err);
		})
	},


	importForm: () => {
		return new Promise((resolve, reject) => {
			Produtos.setPaths();

			R4.getHTML(Produtos.pathForm)
			.then(html => {

				let div = document.createElement('div');
				div.innerHTML = html;
				$('body').append(div.firstChild);

				R4.importCSS(Produtos.pathCSS);
			})
			.then(() => {
				Produtos.getInit();
				Produtos.initForm();
				Produtos.onSave = function(){};
				resolve();
			})
			.catch(err => {
				reject(err);
			});
		});
	}
};