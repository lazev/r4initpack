<?php
require '../config.inc.php';
require R4PHP .'r4iniend.php';

require ROOT .'produtos/produtos.class.php';

$produtos = new Produtos;


switch($_REQUEST['com']) {

	case 'getInit':

		$listaCores = [
			12 => 'Azul',
			45 => 'Vermelho',
			18 => 'Amarelho',
			21 => 'Verde',
			82 => 'Cinza',
			5  => 'Branco',
			33 => 'Preto'
		];

		R4::retOkAPI([
			'listaCores' => $listaCores
		]);

		break;


	case 'read':

		$id = (int)$_REQUEST['idProduto'];

		$dados = $produtos->read($id);

		if($dados === false) {
			R4::dieAPI(0, $produtos->errMsg, $produtos->errObs);
		}

		R4::retOkAPI([
			'produto' => $dados
		]);

		break;


	case 'save':

		$id = (int)$_REQUEST['idProduto'];

		$dados = $produtos->save($id, $_REQUEST);

		if($dados === false) {
			R4::dieAPI(0, $produtos->errMsg, $produtos->errObs);
		}

		R4::retOkAPI([
			'produto' => $dados
		]);

		break;


	case 'list':

		$listFilter = @$_REQUEST['listFilter'] ?: [];
		$listParams = @$_REQUEST['listParams'] ?: [];

		$dados = $produtos->list($listFilter, $listParams);

		if($dados === false) {
			R4::dieAPI(0, $produtos->errMsg, $produtos->errObs);
		}

		R4::retOkAPI([
			'list' => $dados['list'],
			'info' => $dados['info']
		]);

		break;


	case 'delete':

		$ids = $_REQUEST['ids'];

		$dados = $produtos->delete($ids);

		if($dados === false) {
			R4::dieAPI(0, $produtos->errMsg, $produtos->errObs);
		}

		R4::retOkAPI([
			'deleted' => $dados['deleted'],
			'alert'   => $dados['alert']
		]);

		break;


	case 'undel':

		$ids = $_REQUEST['ids'];

		$dados = $produtos->undel($ids);

		if($dados === false) {
			R4::dieAPI(0, $produtos->errMsg, $produtos->errObs);
		}

		R4::retOkAPI([
			'recovered' => $dados['recovered'],
			'alert'     => $dados['alert']
		]);

		break;


	default:
		R4::dieAPI(0, 'Nenhum comando vรกlido informado');
}

require R4PHP .'r4iniend.php';