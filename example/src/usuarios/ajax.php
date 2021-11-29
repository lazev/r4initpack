<?php
require '../config.inc.php';
require R4PHP .'r4iniend.php';

require ROOT .'usuarios/usuarios.class.php';

$check = $db->connect(INDEXDB, INDEXTABLE);
if($check === false) {
	R4::dieAPI(0, $db->errMsg, $db->errObs);
}

$usuarios = new Usuarios;

if(!$usuarios->setUsersConta(R4::getSession('idConta'))) {
	R4::dieAPI(0, $usuarios->errMsg, $usuarios->errObs);
}

switch($_REQUEST['com']) {

	case 'getInit':

		R4::retOkAPI();

		break;


	case 'read':

		$id = (int)$_REQUEST['idUser'];

		$dados = $usuarios->read($id);

		if($dados === false) {
			R4::dieAPI(0, $usuarios->errMsg, $usuarios->errObs);
		}

		R4::retOkAPI([
			'usuario' => $dados
		]);

		break;


	case 'save':

		$id = (int)$_REQUEST['idUser'];

		$dados = $usuarios->save($id, $_REQUEST);

		if($dados === false) {
			R4::dieAPI(0, $usuarios->errMsg, $usuarios->errObs);
		}

		R4::retOkAPI([
			'usuario' => $dados
		]);

		break;


	case 'list':

		$listFilter = @$_REQUEST['listFilter'] ?: [];
		$listParams = @$_REQUEST['listParams'] ?: [];

		$dados = $usuarios->list($listFilter, $listParams);

		if($dados === false) {
			R4::dieAPI(0, $usuarios->errMsg, $usuarios->errObs);
		}

		R4::retOkAPI([
			'list' => $dados['list'],
			'info' => $dados['info']
		]);

		break;


	case 'delete':

		$ids = $_REQUEST['ids'];

		$dados = $usuarios->delete($ids);

		if($dados === false) {
			R4::dieAPI(0, $usuarios->errMsg, $usuarios->errObs);
		}

		R4::retOkAPI([
			'deleted' => $dados['deleted'],
			'alert'   => $dados['alert']
		]);

		break;


	default:
		R4::dieAPI(0, 'Nenhum comando vรกlido informado');
}

require R4PHP .'r4iniend.php';