var Users = {

	pathAjax:   _CONFIG.rootURL +'users/ajax.php',
   pathFields: _CONFIG.rootURL +'users/fields.json',

	idUser: 0,

	listaTipos: [
		{ key: 0,  value: ''            },
		{ key: 5,  value: 'Estagiário'  },
		{ key: 10, value: 'Funcionário' },
		{ key: 20, value: 'Coordenador' },
		{ key: 30, value: 'Gerente'     },
		{ key: 40, value: 'Diretor'     }
	],

	init: function(callback) {
		Users.getInit(() => {

			Users.setEvents();

			Users.initList();

			Users.initFilter();

			Users.initForm();

			if(typeof callback === 'function') callback();
		});
	},


	getInit: function(callback) {

		R4.getJSON(Users.pathAjax, {com: 'getInit'})

		.then(() => {
			if(typeof callback === 'function') callback();
		})

		.catch(err => {
			Warning.show('Erro ao buscar os dados iniciais', err);
		});
	},


	setEvents: function() {
		$('#usersBtnAdd').on('click', function() {
			Users.insert();
		});

		Pop.hint($('#usersBtnDel'), 'Excluir');
		$('#usersBtnDel').on('click', function(ev) {
			ev.preventDefault();
			Users.delete('listaUsers');
		});
	},


	initList: function() {

		Table.create({
			idDestiny: 'listaUsers',
			classes:   'striped',
			withCheck: true,
			arrHead:   [
				{ label: 'Id',     orderBy: 'id'    },
				{ label: 'User',   orderBy: 'user'  },
				{ label: 'Nome',   orderBy: 'nome'  },
				{ label: 'Fones',  orderBy: 'tags'  }, //O tipo tags dá uma separação após a vírgula
				{ label: 'Tags',   orderBy: 'tags', type: 'tags' },
				{ label: 'Ativo?', orderBy: 'ativo' }
			],
			onLineClick:  value => Users.edit(value),
			onOrderBy:    () => { Users.filter(); },
			onPagination: () => { Users.filter(); },
			onRegPerPage: () => { Users.filter(); }
		});
	},


	initFilter: function() {

		Fields.create([
			{ id: 'busca', type: 'text'    },
			{ id: 'btn',   type: 'submit', classes: 'bgInfo' }
		], 'filtro');

		$('#formFiltro').on('submit', function(ev) {
			ev.preventDefault();
			Users.filter();
		});
	},


	initForm: function() {
		Dialog.create({
			elem: $('#formUsers'),
			title: 'Dados do usuário',
			buttons: [
				{
					label: 'Salvar',
					classes: 'R4DialogSaver bgSuccess white',
					onClick: function() {
						Users.save();
					}
				},
				{
					label: 'Fechar',
					classes: 'R4DialogCloser'
				}
			]
		});

		Fields.createFromFile(Users.pathFields, 'users')

		.then(() => {
			Users.setFormEvents();
		});
	},


	setFormEvents: function() {
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

			Users.idUser = ret.user.id;

			$('#users_nome').val(    ret.user.nome    );
			$('#users_cpfcnpj').val( ret.user.cpfcnpj );
			$('#users_fones').val(   ret.user.fones   );
			$('#users_emails').val(  ret.user.emails  );
			$('#users_salario').val( ret.user.salario );
			$('#users_idTipo').val(  ret.user.idTipo  );
			$('#users_tags').val(    ret.user.tags    );
			$('#users_cep').val(     ret.user.cep     );
			$('#users_dtNasc').val(  ret.user.dtNasc  );
			$('#users_user').val(    ret.user.user    );
			$('#users_ativo').val(   ret.user.ativo   );

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
				Users.edit(ret.user.id);
			});

			Warning.show('Usuário '+ ret.user.id +' salvo com sucesso', btn);

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
	}
};