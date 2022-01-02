const Usuarios = {

	idUsuario: 0,

	setPaths: () => {
		Usuarios.pathAjax   = _CONFIG.rootURL +'usuarios/ajax.php';
		Usuarios.pathFields = _CONFIG.rootURL +'usuarios/fields.json';
	},


	init: async () => {
		Usuarios.setPaths();
		Usuarios.initForm();
		Usuarios.initFields();
		Usuarios.initList();
		Usuarios.getInit();
	},


	initForm: async () => {
		await Dialog.create({
			elem: $('#formUsuarios'),
			title: 'Dados do usuario',
			buttons: [
				{
					label: 'Salvar',
					classes: 'bgSuccess white',
					onClick: function(ev) {
						console.log('Salvando usuário...');
						Usuarios.save();
					}
				},
				{
					label: 'Fechar',
					classes: 'R4DialogCloser'
				}
			]
		});
	},


	initFields: async () => {
		await Fields.createFromFile(Usuarios.pathFields, 'usu');
	},


	initList: () => {

		let head = [
			{ label: 'Cod',    orderBy: 'id'       },
			{ label: 'Nome',   orderBy: 'nome'     },
			{ label: 'Fone',   orderBy: 'fones'    },
			{ label: 'Email',  orderBy: 'emails'   },
			{ label: 'Acesso', orderBy: 'provider' }
		];

		Table.create({
			idDestiny:    'listaUsuarios',
			classes:      'striped',
			arrHead:      head,
			withCheck:    true,
			onLineClick:  value => { Usuarios.edit(value);   },
			onOrderBy:    value => { Usuarios.filter(value); },
			onPagination: value => { Usuarios.filter(value); },
			onRegPerPage: value => { Usuarios.filter(value); }
		});
	},


	getInit: () => {
		let params = {
			com: 'getInit'
		};
		R4.getJSON(Usuarios.pathAjax, params)
		.then(ret => {});
	},


	insert: () => {
		Usuarios.idUsuario = 0;

		$('#formUsuarios').reset();

		$('#usuBoxAcesso').addClass('hidden');

		$('#formUsuarios').dialog('open');
	},


	edit: id => {
		if(!id) return;

		let params = {
			com: 'read',
			idUsuario: id
		};

		R4.getJSON(Usuarios.pathAjax, params)
		.then(ret => {
			Usuarios.idUsuario = ret.usuario.id;

			$('#usu_nome').val(   ret.usuario.nome   );
			$('#usu_fones').val(  ret.usuario.fones  );
			$('#usu_emails').val( ret.usuario.emails );
			$('#usu_tags').val(   ret.usuario.tags   );

			$('#usuBoxAcesso').removeClass('hidden');

			$('#formUsuarios').dialog('open');
		})
	},


	save: idUsuario => {

		let params = {
			com:        'save',
			idUsuario: Usuarios.idUsuario,
			nome:   $('#usu_nome').val(),
			fones:  $('#usu_fones').val(),
			emails: $('#usu_emails').val(),
			tags:   $('#usu_tags').val()
		};

		R4.getJSON(Usuarios.pathAjax, params)

		.then(ret => {

			Warning.show('Usuario id '+ ret.usuario.id);

			Usuarios.list();

			$('#formUsuarios').dialog('close');

		})

		.catch(err => {
			Warning.show('Erro ao salvar o usuário');
			console.log(err);
		})
	},


	delete: id => {

		//register id (int) or table html id (str)
		let ids = (isNaN(id)) ? Table.getAllSel(id) : id;

		if(!ids.length) {
			Warning.show('Nenhum código informado para exclusão');
			return;
		}

		let params = {
			com: 'delete',
			ids: ids
		}

		R4.getJSON(Usuarios.pathAjax, params)

		.then(ret => {
			if(ret.deleted.length) {
				Warning.show('Itens excluídos: '+ ret.deleted.join(', '));
				Usuarios.list();
			}

			if(ret.alert) {
				let k;
				for(k in ret.alert) {
					Warning.show('Erro na exclusão do item '+ k, ret.alert[k]);
				}
			}
		});
	},


	filter: () => {
		let filter = {};

		//PEDRINHA: Click no onRegPerPage não tá funcionando

		Usuarios.list({
			listParams: Table.getInfo($('#listaUsuarios')),
			listFilter: filter
		});
	},


	list: arrFilter => {

		if(!arrFilter) arrFilter = {};

		let params = {
			com: 'list',
			listParams: arrFilter.listParams,
			listFilter: arrFilter.listFilter
		};

		R4.getJSON(Usuarios.pathAjax, params)
		.then(ret => {

			let check   = '';
			let body    = [];
			let foot    = [];
			let destiny = $('#listaUsuarios');
			let vTotal  = 0.00;

			Table.setInfo(destiny, ret.info);

			if(!ret.list.length) {
				Table.clearBody(destiny);
				return;
			}

			let fones, emails, acesso;

			ret.list.forEach(item => {

				fones  = (item.fones)  ? item.fones.split(',').join(', ')  : '';
				emails = (item.emails) ? item.emails.split(',').join(', ') : '';
				acesso = '<span class="badge">'+ item.provider +'</span>';

				body.push({
					value: item.id,
					cells: [
						item.id,
						item.nome,
						fones,
						emails,
						acesso
					],
					classes: [
						'nonClickCol',
						''
					]
				});
			});

			Table.updateContent(destiny, body, foot);

		})
		.catch(err => {
			console.log(err);
			Warning.show('Erro', err);
		})
	}
};