//Nome da classe igual ao nome do módulo, com letra maiúscula
var Users = {

	//Define os caminhos de arquivos externos usados pelo módulo
	pathAjax:   _CONFIG.rootURL +'users/ajax.php',
	pathFields: _CONFIG.rootURL +'users/fields.json',
	pathForm:   _CONFIG.rootURL +'users/templates/formUsers.html',
	pathCSS:    _CONFIG.rootURL +'users/style.css',

	//Parâmetro que identifica o user que está sendo editado no momento.
	//No momento de salvar a edição, esse id identifica que é pra atualizar
	//Se for zero, ele vai gravar um novo user.
	idUser: 0,


	//Variáveis e listas específicas do módulo
	listaTipos: [
		{ key: 0,  value: ''            },
		{ key: 5,  value: 'Estagiário'  },
		{ key: 10, value: 'Funcionário' },
		{ key: 20, value: 'Coordenador' },
		{ key: 30, value: 'Gerente'     },
		{ key: 40, value: 'Diretor'     }
	],


	//Roda as funções de inicialização do módulo
	init: callback => {
		Users.getInit(() => {

			Users.initFilter();

			Users.initList();

			Users.initEvents();

			Users.filter();

			Users.initForm();

			if(typeof callback === 'function') callback();
		});
	},


	//Função comum em todos os módulos (mesmo que não seja usada)
	//Ela busca dados essenciais pro funcionamento do módulo.
	//Por exemplo, pode buscar uma lista de situações ou categorias
	//pra guardar na memória ao carregar a tela.
	getInit: function(callback) {

		R4.getJSON(Users.pathAjax, {com: 'getInit'})

		.then(() => {
			if(typeof callback === 'function') callback();
		})

		.catch(err => {
			Warning.show('Erro ao buscar dados iniciais', err);
		});
	},


	//Inicializa o filtro do módulo. Neste caso aqui
	//o filtro é apenas a busca simples, sem a chamada
	//do filtro avançado.
	initFilter: function() {

		Fields.create([
			{ id: 'busca', type: 'text' },
		], 'filtro');

		$('#formFilter').on('submit', function(ev) {
			ev.preventDefault();

			Table.setInfo($('#listaProdTipos'), { currentPage: 1 });

			Users.filter();
		});

		Pop.hint($('#filtro_btnFiltrar'), 'Busca rápida');
	},


	//Inicia o elemento da listagem. Neste ponto apenas a matriz
	//do cabeçalho é definida. Os dados da lista são gerados por
	//ajax ao carregar a página
	initList: () => {

		//orderBy gera os eventos de ordenação a partir do clique
		//no cabeçalho. O type indica a formatação do dado
		Table.create({
			idDestiny: 'listaUsers',
			classes:   'striped sticky',
			arrHead:   [
				{ label: 'Id',     orderBy: 'id'    },
				{ label: 'User',   orderBy: 'user'  },
				{ label: 'Nome',   orderBy: 'nome'  },
				{ label: 'Fones',  orderBy: 'tags'  },
				{ label: 'Tags',   orderBy: 'tags', type: 'tags' },
				{ label: 'Ativo?', orderBy: 'ativo' }
			],
			withCheck:    true,
			onLineClick:  value => Users.edit(value),
			onOrderBy:    () => { Users.filter(); },
			onPagination: () => { Users.filter(); },
			onRegPerPage: () => { Users.filter(); }
		});
	},


	//Eventos vinculados ao módulo. Diferente dos
	//eventos de formulário, estes não são chamados
	//quando o form é incorporado em outro módulo.
	initEvents: function() {
		if($('#usersBtnAdd')) $('#usersBtnAdd').on('click', Users.insert);

		Pop.hint($('#usersBtnDel'), 'Excluir');
		//Nunca usar arrow functions na associação de eventos.
		//Quando usado o this não identifica o elemento do evento.
		if($('#usersBtnDel')) $('#usersBtnDel').on('click', function() {
			Users.delete('listaUsers');
		});
	},


	//Inicia o formulário, criando uma dialog
	//com o HTML encontrado dentro da pasta
	//templates aqui dentro do próprio módulo
	//mas o HTML poderia também estar direto
	//no index.html
	initForm: function() {

		var formElem = $('#formUsers');

		//A função dialog usa o HTML encontrado
		//dentro do div #formProdTipos e adiciona
		//botões com eventos
		Dialog.create({
			elem: formElem,
			title: 'Dados do usuário',
			changeMonitor: true,
			buttons: [
				//O elemento com a classe R4DialogSaver recebe o evento
				//de click automático ao pressionar ALT+ENTER
				{
					label: 'Salvar',
					classes: 'R4DialogSaver bgSuccess white',
					onClick: function() {
						Users.save();
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

		Fields.createFromFile(Users.pathFields, 'users')

		.then(() => {
			Users.formEvents();
		});
	},


	formEvents: function() {
	},


	filter: function() {
		Users.list({
			listParams: Table.getInfo($('#listaUsers')),
			listFilter: Fields.objectize($('#formFiltro'))
		});
	},


	list: function(arrFilter) {

		if(!arrFilter) arrFilter = {};

		R4.getJSON(Users.pathAjax, {
			com: 'list',
			listParams: arrFilter.listParams,
			listFilter: arrFilter.listFilter
		})

		.then(ret => {

			let destiny = $('#listaUsers'),
			    body    = [],
			    foot    = [];

			Table.setInfo(destiny, ret.info);

			if(!ret.list.length) {
				Table.clearBody(destiny);
				return;
			}

			let arrTxtAtivo = [
				'<div class="bgDanger white center corner">Não</div>',
				'<div class="bgSuccess white center corner">Sim</div>'
			];

			ret.list.forEach(item => {

				body.push({
					value: item.id,
					cells: [
						item.id,
						item.user,
						item.nome,
						item.fones,
						item.tags,
						arrTxtAtivo[item.ativo]
					],
					classes: [
						'nonClickCol',
						'',
						'',
						'small',
						'',
						''
					]
				});

			});

			//foot.push({
			//	cells: [
			//		'',
			//		'TOTAL',
			//		R4.round(vTotal, 2)
			//	]
			//});

			Table.updateContent(destiny, body, foot);
		})

		.catch(err => {
			console.log(err);
			Warning.show('Erro', err);
		});
	},


	insert: function() {

		Users.idUser = 0;

		Fields.reset($('#formUsers'));

		Dialog.open($('#formUsers'));
	},


	edit: idUser => {
		if(!idUser) return;

		R4.blockScreen(true);

		Users.idUser = 0;

		Fields.reset($('#formUsers'));

		R4.getJSON(Users.pathAjax, {
			com:    'read',
			idUser: idUser
		})

		.then(ret => {
			R4.blockScreen(false);

			Users.idUser = ret.item.id;

			$('#users_nome').val(    ret.item.nome    );
			$('#users_cpfcnpj').val( ret.item.cpfcnpj );
			$('#users_fones').val(   ret.item.fones   );
			$('#users_emails').val(  ret.item.emails  );
			$('#users_salario').val( ret.item.salario );
			$('#users_idTipo').val(  ret.item.idTipo  );
			$('#users_tags').val(    ret.item.tags    );
			$('#users_cep').val(     ret.item.cep     );
			$('#users_dtNasc').val(  ret.item.dtNasc  );
			$('#users_user').val(    ret.item.user    );
			$('#users_ativo').val(   ret.item.ativo   );

			Dialog.open($('#formUsers'));
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

		let params = Fields.objectize($('#formUsers'), {
			com:    'save',
			idUser: Users.idUser
		});

		R4.getJSON(Users.pathAjax, params)

		.then(ret => {

			R4.blockScreen(false);

			let btn = $new('<button type="button" class="R4">Detalhar</button>');
			btn.on('click', function(ev) {
				ev.preventDefault();
				Users.edit(ret.item.id);
			});

			Warning.show('Usuário '+ ret.item.id +' salvo com sucesso', btn);

			Users.onSave();

			Dialog.close($('#formUsers'));
		})

		.catch(err => {
			R4.blockScreen(false);
			Users.onSaveError(err);
		});
	},


	onSave: () => {
		Users.list();
	},


	onSaveError: err => {
		Fields.setErrFields(err, 'users');
		console.log(err);
	},


	delete: id => {
		let ids = (isNaN(id)) ? Table.getAllSel(id) : id;

		if(!ids.length) {
			Warning.show('Nenhum código informado para exclusão');
			return;
		}

		R4.getJSON(Users.pathAjax, {
			com: 'delete',
			ids: ids
		})

		.then(ret => {
			if(ret.deleted.length) {

				let btn = $new('<button type="button" class="R4">Recuperar</button>');
				btn.on('click', function(ev){
					ev.preventDefault();
					Users.undel(ret.deleted.join(','));
				});

				Warning.show('Itens excluidos: '+ ret.deleted.join(', '), btn);

				Users.list();
			}

			if(ret.alert) {
				for(let k in ret.alert) {
					Warning.show('Erro na exclusão do item '+ k, ret.alert[k]);
				}
			}
		});
	},


	undel: ids => {

		if(!ids.length) {
			Warning.show('Nenhum código informado para recuperação');
			return;
		}

		R4.getJSON(Users.pathAjax, {
			com: 'undel',
			ids: ids
		})

		.then(ret => {
			if(ret.recovered.length) {
				Warning.show('Itens recuperados: '+ ret.recovered.join(', '));
				Users.list();
			}

			if(ret.alert) {
				for(let k in ret.alert) {
					Warning.show('Erro na recuperação do item '+ k, ret.alert[k]);
				}
			}
		});
	},


	importForm: callback => {

		return new Promise((resolve, reject) => {

			R4.getHTML(Users.pathForm)

			.then(html => {

				let elem = $new(html);

				$('body').append(elem);

				R4.importCSS(Users.pathCSS);
			})

			.then(() => {
				Users.getInit(() => {
					Users.initForm();

					Users.onSave = function(){};

					if(typeof callback == 'function') callback();

					resolve();
				});
			})

			.catch(err => { reject(err); });
		});
	}
};