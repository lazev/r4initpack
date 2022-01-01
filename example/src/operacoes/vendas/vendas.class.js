/*
 *
 * BUG: buttons dentro de form
 *
 * */


var Vendas = {

	idVenda: 0,

	listaSituacao: {
		10: 'Orçamento',
		50: 'Concluída',
		90: 'Cancelada'
	},

	setPaths: () => {
		Vendas.pathAjax     = _CONFIG.rootURL +'operacoes/vendas/ajax.php';
		Vendas.pathFields   = _CONFIG.rootURL +'operacoes/vendas/fields.json';
		Vendas.pathProdutos = _CONFIG.rootURL +'produtos/produtos.class.js';
	},


	init: async () => {
		Vendas.setPaths();
		Vendas.initForm();
		Vendas.initFields();
		Vendas.initList();
		Vendas.getInit();
	},


	initForm: async () => {
		await $('#formVendas').dialog({
			buttons: [
				{
					label: 'Salvar',
					classes: 'bgSuccess white',
					onClick: function(ev) {
						Vendas.save();
					}
				},
				{
					label: 'Fechar',
					classes: 'R4DialogCloser'
				}
			],
			classes: 'full'
		});
	},


	initFields: async () => {
		await Fields.createFromFile(Vendas.pathFields, 'vendas');
	},


	initList: () => {

		let head = [
			{ label: 'Cod',      orderBy: 'id' },
			{ label: 'Cliente',  orderBy: 'nomeCliente' },
			{ label: 'Data',     orderBy: 'dtVenda',  type: 'date' },
			{ label: 'Preco',    orderBy: 'vTotal',   type: 'decimal' },
			{ label: 'Situação', orderBy: 'situacao'  }
		];

		Table.create({
			idDestiny:    'listaVendas',
			classes:      'striped',
			arrHead:      head,
			withCheck:    true,
			onLineClick:  value => { Vendas.edit(value);   },
			onOrderBy:    value => { Vendas.filter(value); },
			onPagination: value => { Vendas.filter(value); },
			onRegPerPage: value => { Vendas.filter(value); }
		});
	},


	getInit: () => {
		let params = {
			com: 'getInit'
		};
		R4.getJSON(Vendas.pathAjax, params)
		.then(ret => {

		});
	},


	insert: () => {
		Vendas.idVenda = 0;

		$('#formVendas').reset();

		$('#formVendas').dialog('open');
	},


	edit: id => {
		if(!id) return;

		let params = {
			com: 'read',
			idVenda: id
		};

		R4.getJSON(Vendas.pathAjax, params)
		.then(ret => {
			Vendas.idVenda = ret.venda.id;

			$('#prod_nome').val(       ret.venda.nome       );
			$('#prod_categoria').val(  ret.venda.categoria  );
			$('#prod_preco').val(      ret.venda.preco      );
			$('#prod_comEstoque').val( ret.venda.comEstoque );
			$('#prod_tags').val(       ret.venda.tags       );

			$('#formVendas').dialog('open');
		})
	},


	save: idVenda => {

		let params = {
			com:        'save',
			idVenda: Vendas.idVenda,
			nome:       $('#prod_nome').val(),
			categoria:  $('#prod_categoria').val(),
			preco:      $('#prod_preco').val(),
			comEstoque: $('#prod_comEstoque').val(),
			tags:       $('#prod_tags').val()
		};

		R4.getJSON(Vendas.pathAjax, params)

		.then(ret => {

			let btn = document.createElement('button');
			btn.setAttribute('type', 'button');
			btn.classList.add('R4');
			btn.innerHTML = 'Detalhar';
			btn.addEventListener('click', ev => {
				ev.preventDefault();
				Vendas.edit(ret.venda.id);
			});

			Warning.on(
				'Venda '+ ret.venda.id +' salvo com sucesso',
				btn
			);

			Vendas.list();

			$('#formVendas').dialog('close');

		})

		.catch(err => {
			Warning.on('Erro ao salvar o venda');
			console.log(err);
		})
	},


	delete: id => {

		let ids = (isNaN(id)) ? Table.getAllSel(id) : id;

		if(!ids.length) {
			Warning.on('Nenhum código informado para exclusão');
			return;
		}

		let params = {
			com: 'delete',
			ids: ids
		}

		R4.getJSON(Vendas.pathAjax, params)

		.then(ret => {
			if(ret.deleted.length) {
				let btn = document.createElement('button');
				btn.setAttribute('type', 'button');
				btn.classList.add('R4');
				btn.innerHTML = 'Desfazer';
				btn.addEventListener('click', ev => {
					ev.preventDefault();
					Vendas.undel(ret.deleted.join(','));
				});

				Warning.on(
					'Itens excluidos: '+ ret.deleted.join(', '),
					btn
				);

				Vendas.list();
			}

			if(ret.alert) {
				let k;
				for(k in ret.alert) {
					Warning.on('Erro na exclusão do item '+ k, ret.alert[k]);
				}
			}
		});
	},


	undel: ids => {

		if(!ids.length) {
			Warning.on('Nenhum código informado para recuperação');
			return;
		}

		let params = {
			com: 'undel',
			ids: ids
		}

		R4.getJSON(Vendas.pathAjax, params)

		.then(ret => {
			if(ret.recovered.length) {
				Warning.on('Itens recuperados: '+ ret.recovered.join(', '));
				Vendas.list();
			}

			if(ret.alert) {
				let k;
				for(k in ret.alert) {
					Warning.on('Erro na recuperação do item '+ k, ret.alert[k]);
				}
			}
		});
	},


	filter: () => {
		let filter = {};

		Vendas.list({
			listParams: Table.getInfo($('#listaVendas')),
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

		R4.getJSON(Vendas.pathAjax, params)
		.then(ret => {

			let goodVal = '';
			let check   = '';
			let body    = [];
			let foot    = [];
			let destiny = $('#listaVendas');
			let vTotal  = 0.00;

			Table.setInfo(destiny, ret.info);

			if(!ret.list.length) {
				Table.clearBody(destiny);
				return;
			}

			ret.list.forEach(item => {

				body.push({
					value: item.id,
					cells: [
						item.id,
						item.nomeCli,
						item.dtVenda,
						item.vTotal,
						item.situacao
					],
				});

				vTotal += parseFloat(item.preco);
			});

			foot.push({
				cells: [
					'',
					'TOTAL LISTADO',
					'',
					R4.round(vTotal, 2),
					''
				]
			});

			Table.updateContent(destiny, body, foot);

		})
		.catch(err => {
			console.log(err);
			Warning.on('Erro', err);
		})
	},


	detalharProd1: function(codProd) {

		codProd = 1;

		if(typeof Produtos === 'object') {
			Produtos.edit(codProd);
		} else {
			R4.getScript(Vendas.pathProdutos )
			.then(() => Produtos.importForm()    )
			.then(() => Produtos.edit(codProd));
		}
	}
};