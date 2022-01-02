/*
 *
 * BUG: buttons dentro de form
 *
 * */


var Vendas = {

	idVenda: 0,

	pathAjax:     _CONFIG.rootURL +'operacoes/vendas/ajax.php',
	pathFields:   _CONFIG.rootURL +'operacoes/vendas/fields.json',
   pathProdutos: _CONFIG.rootURL +'produtos/produtos.class.js',

	listaSituacao: {
		10: 'Orçamento',
		50: 'Concluída',
		90: 'Cancelada'
	},


	init: async () => {
		Vendas.getInit(() => {
			Vendas.initForm();
			Vendas.initList();
		});
	},


	getInit: callback => {

		R4.getJSON(Vendas.pathAjax, {
			com: 'getInit'
		})

		.then(ret => {
			if(typeof callback === 'function') {
				callback();
			}
		});
	},


	initForm: async () => {

		Dialog.create({
			elem: $('#formVendas'),
			title: 'Dados da venda',
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

		Fields.createFromFile(Vendas.pathFields, 'vendas');
	},


	initList: () => {

		Table.create({
			idDestiny:    'listaVendas',
			classes:      'striped',
			arrHead:      [
				{ label: 'Cod',      orderBy: 'id' },
				{ label: 'Cliente',  orderBy: 'nomeCliente' },
				{ label: 'Data',     orderBy: 'dtVenda',  type: 'date' },
				{ label: 'Preco',    orderBy: 'vTotal',   type: 'decimal' },
				{ label: 'Situação', orderBy: 'situacao'  }
			],
			withCheck:    true,
			onLineClick:  value => { Vendas.edit(value);   },
			onOrderBy:    value => { Vendas.filter(value); },
			onPagination: value => { Vendas.filter(value); },
			onRegPerPage: value => { Vendas.filter(value); }
		});
	},


	insert: () => {
		Vendas.idVenda = 0;

		Fields.reset($('#formVendas'));

		Dialog.open($('#formVendas'));
	},


	edit: idVenda => {
		if(!idVenda) return;

		R4.getJSON(Vendas.pathAjax, {
			com: 'read',
			idVenda: idVenda
		})

		.then(ret => {
			Vendas.idVenda = ret.venda.id;

			$('#prod_nome').val(       ret.venda.nome       );
			$('#prod_categoria').val(  ret.venda.categoria  );
			$('#prod_preco').val(      ret.venda.preco      );
			$('#prod_comEstoque').val( ret.venda.comEstoque );
			$('#prod_tags').val(       ret.venda.tags       );

			Dialog.open($('#formVendas'));
		})

		.catch(err => {
			Warning.show('Erro ao buscar os dados da venda');
			console.log(err);
		});
	},


	save: () => {

		R4.getJSON(Vendas.pathAjax, {
			com:        'save',
			idVenda:    Vendas.idVenda,
			nome:       $('#prod_nome').val(),
			categoria:  $('#prod_categoria').val(),
			preco:      $('#prod_preco').val(),
			comEstoque: $('#prod_comEstoque').val(),
			tags:       $('#prod_tags').val()
		})

		.then(ret => {

			Warning.show(
				'Venda '+ ret.venda.id +' salvo com sucesso',

				$new('button', {
					html: 'Detalhar',
					attr: { type: 'button', class: 'R4', },
					event: {
						click: function(ev) {
							ev.preventDefault();
							Vendas.edit(ret.venda.id);
						}
					}
				})

			);

			Vendas.list();

			Dialog.close($('#formVendas'));
		})

		.catch(err => {
			Warning.show('Erro ao salvar a venda');
			console.log(err);
		})
	},


	delete: id => {

		let ids = (isNaN(id)) ? Table.getAllSel(id) : id;

		if(!ids.length) {
			Warning.show('Nenhum código informado para exclusão');
			return;
		}

		let params = {
			com: 'delete',
			ids: ids
		}

		R4.getJSON(Vendas.pathAjax, params)

		.then(ret => {
			if(ret.deleted.length) {

				Warning.show(
					'Itens excluidos: '+ ret.deleted.join(', '),
					$new('button', {
						html: 'Desfazer',
						attr: { type: 'button', class: 'R4', },
						event: {
							click: function(ev) {
								ev.preventDefault();
								Vendas.undel(ret.deleted.join(','));
							}
						}
					})
				);

				Vendas.list();
			}

			if(ret.alert) {
				let k;
				for(k in ret.alert) {
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

		let params = {
			com: 'undel',
			ids: ids
		}

		R4.getJSON(Vendas.pathAjax, params)

		.then(ret => {
			if(ret.recovered.length) {
				Warning.show('Itens recuperados: '+ ret.recovered.join(', '));
				Vendas.list();
			}

			if(ret.alert) {
				let k;
				for(k in ret.alert) {
					Warning.show('Erro na recuperação do item '+ k, ret.alert[k]);
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

		R4.getJSON(Vendas.pathAjax, {
			com: 'list',
			listParams: arrFilter.listParams,
			listFilter: arrFilter.listFilter
		})

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
			Warning.show('Erro', err);
		})
	},


	detalharProd1: function(codProd) {

		codProd = 1;

		if(typeof Produtos === 'object') {
			Produtos.edit(codProd);
		} else {
			R4.getScript(Vendas.pathProdutos  )
			.then(() => Produtos.importForm() )
			.then(() => Produtos.edit(codProd));
		}
	}
};