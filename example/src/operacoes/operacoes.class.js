var Operacoes = {

	init: function(tabAtiva) {

		Tabs.create({
			idElem:  'tabMenu',
			targetOn: tabAtiva,
			click:    Operacoes.carregarModulo
		});

	},


	carregarModulo: targetId => {

		if(targetId == 'moduloVendas') {

			if(typeof Vendas === 'object') Vendas.listar();
			else {
				R4.getScript('operacoes/vendas/vendas.class.js')
				.then(() => Vendas.incorporar())
				.then(() => Vendas.listar());
			}
		}

		else if(targetId == 'moduloCompras') {


		}

		else if(targetId == 'moduloProdutos') {

			//Se já tem o módulo carregado, apenas lista
			if(typeof Produtos === 'object') Produtos.listar();
			else {
				//Se não tem, carrega, incorpora e lista
				R4.getScript('produtos/produtos.class.js')
				.then(() => Produtos.incorporar())
				.then(() => Produtos.listar());
			}

		}
	}

};