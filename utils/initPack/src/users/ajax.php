<?php
$_CONFIG = [
	'requireLogin' => true,
	'requireReferer' => 'https'
];

require '../config.inc.php';
require R4PHP .'r4iniend.php';

$input = R4::getRequest();

require ROOT .'users/users.class.php';

$users = new Users;

switch($input['com']) {

	case 'getInit':

		R4::retOkAPI();

		break;


	case 'read':

		$id = (int)$input['idUser'];

		$dados = $users->read($id);

		if($dados === false) {
			Log::erro('users', $id, $users->errMsg, $users->errObs);
			R4::dieAPI(0, $users->errMsg, $users->errObs);
		}

		R4::retOkAPI([
			'item' => $dados
		]);

		break;


	case 'save':
		$id = (int)$input['idUser'];

		$dados = $users->save($id, $input);

		if($dados === false) {
			Log::erro('users', $id, $users->errMsg, $users->errObs, $users->errFields);
			R4::dieAPI(0, $users->errMsg, $users->errObs, $users->errFields);
		}

		R4::retOkAPI([
			'item' => $dados
		]);

		break;


	case 'list':

		$listFilter = $input['listFilter'] ?? [];
		$listParams = $input['listParams'] ?? [];

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

		$ids = $input['ids'];

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

		$ids = $input['ids'];

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