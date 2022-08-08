<?php
require '../config.inc.php';
require R4PHP .'r4iniend.php';
require ROOT .'_assets/php/log.class.php';
require ROOT .'users/users.class.php';
$users = new Users;

switch($_REQUEST['com']) {

	case 'getInit':

		R4::retOkAPI();

		break;


	case 'read':

		$id = (int)$_REQUEST['idUser'];

		$dados = $users->read($id);

		if($dados === false) {
			Log::erro('users', $id, $users->errMsg, $users->errObs);
			R4::dieAPI(0, $users->errMsg, $users->errObs);
		}

		R4::retOkAPI([
			'user' => $dados
		]);

		break;


	case 'save':
		$id = (int)$_REQUEST['idUser'];

		$dados = $users->save($id, $_REQUEST);

		if($dados === false) {
			Log::erro('users', $id, $users->errMsg, $users->errObs, $users->errFields);
			R4::dieAPI(0, $users->errMsg, $users->errObs, $users->errFields);
		}

		R4::retOkAPI([
			'user' => $dados
		]);

		break;


	case 'list':

		$listFilter = $_REQUEST['listFilter'] ?: [];
		$listParams = $_REQUEST['listParams'] ?: [];

		$dados = $users->list($listFilter, $listParams);

		if($dados === false) {
			Log::erro('users', 0, $users->errMsg, $users->errObs);
			R4::dieAPI(0, $users->errMsg, $users->errObs);
		}

		R4::retOkAPI([
			'list' => $dados['list'],
			'info' => $dados['info']
		]);

		break;


	case 'delete':

		$ids = $_REQUEST['ids'];

		$dados = $users->delete($ids);

		if($dados === false) {
			Log::erro('users', 0, $users->errMsg, $users->errObs);
			R4::dieAPI(0, $users->errMsg, $users->errObs);
		}

		R4::retOkAPI([
			'deleted' => $dados['deleted'],
			'alert'   => $dados['alert']
		]);

		break;


	case 'undel':

		$ids = $_REQUEST['ids'];

		$dados = $users->undel($ids);

		if($dados === false) {
			Log::erro('users', 0, $users->errMsg, $users->errObs);
			R4::dieAPI(0, $users->errMsg, $users->errObs);
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