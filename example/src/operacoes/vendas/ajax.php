<?php
require '../../config.inc.php';
require R4PHP .'r4iniend.php';

require ROOT .'operacoes/vendas/vendas.class.php';

$vendas = new Vendas;


switch($_REQUEST['com']) {

	case 'getInit':

		R4::retOkAPI();

		break;


	case 'read':

		$id = (int)$_REQUEST['idProduto'];

		$dados = $vendas->read($id);

		if($dados === false) {
			R4::dieAPI(0, $vendas->errMsg, $vendas->errObs);
		}

		R4::retOkAPI([
			'venda' => $dados
		]);

		break;


	case 'save':

		$id = (int)$_REQUEST['idProduto'];

		$dados = $vendas->save($id, $_REQUEST);

		if($dados === false) {
			R4::dieAPI(0, $vendas->errMsg, $vendas->errObs);
		}

		R4::retOkAPI([
			'venda' => $dados
		]);

		break;


	case 'list':

		$listFilter = @$_REQUEST['listFilter'] ?: [];
		$listParams = @$_REQUEST['listParams'] ?: [];

		$dados = $vendas->list($listFilter, $listParams);

		if($dados === false) {
			R4::dieAPI(0, $vendas->errMsg, $vendas->errObs);
		}

		R4::retOkAPI([
			'list' => $dados['list'],
			'info' => $dados['info']
		]);

		break;


	case 'delete':

		$ids = $_REQUEST['ids'];

		$dados = $vendas->delete($ids);

		if($dados === false) {
			R4::dieAPI(0, $vendas->errMsg, $vendas->errObs);
		}

		R4::retOkAPI([
			'deleted' => $dados['deleted'],
			'alert'   => $dados['alert']
		]);

		break;


	case 'undel':

		$ids = $_REQUEST['ids'];

		$dados = $vendas->undel($ids);

		if($dados === false) {
			R4::dieAPI(0, $vendas->errMsg, $vendas->errObs);
		}

		R4::retOkAPI([
			'recovered' => $dados['recovered'],
			'alert'     => $dados['alert']
		]);

		break;


	default:
		R4::dieAPI(0, 'Nenhum comando válido informado');
}

require R4PHP .'r4iniend.php';