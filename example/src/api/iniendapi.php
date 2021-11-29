<?php
if(!defined('ALREADYINITAPI')) {
	define('ALREADYINITAPI', true);

	header('Access-Control-Allow-Origin: *');
	header('Access-Control-Allow-Methods: HEAD, DELETE, POST, GET, PUT, OPTIONS');
	header('Access-Control-Max-Age: 3600');
	header('Access-Control-Allow-Headers: Content-Type, Access-Control-Allow-Headers, Authorization, X-Requested-With');
	header('Content-Type: application/json; charset=UTF-8');

	require R4PHP .'r4iniend.php';

	require_once ROOT .'api/api.class.php';
	$api = new Api;

	$user = (isset($_SERVER['PHP_AUTH_USER'])) ? $_SERVER['PHP_AUTH_USER'] : false;
	$pass = (isset($_SERVER['PHP_AUTH_PW']))   ? $_SERVER['PHP_AUTH_PW']   : false;

	if($api->checkRequestRateByIP([
		'maxCalls'  => 7,
		'secPeriod' => 1,
		'user'      => $user,
		'pass'      => $pass
	]) === false) {
		$api->die429();
	}

	if($api->checkRequestRateByIP([
		'maxCalls'  => 500,
		'secPeriod' => 60,
		'user'      => $user,
		'pass'      => $pass
	]) === false) {
		$api->die429();
	}

	if($api->grantAccess($user, $pass) === false) {
		$api->die401();
	}

	if($api->setMethod($_SERVER['REQUEST_METHOD']) === false) {
		$api->die405();
	}

	$api->setBodyContent(file_get_contents('php://input'));

	if(isset($_REQUEST['id']))     $api->setIdModule($_REQUEST['id']);
	if(isset($_REQUEST['detail'])) $api->setDetailModule($_REQUEST['detail']);

} else {

	switch($api->method) {
		case 'GET':
			if($api->idModule) {
				$response = moduleRead($api->idModule);

				$detail = $api->detailModule;

				if($detail) {
					$retDados = [];
					if(strpos($detail, ',') !== false) {
						$arr = explode(',', $detail);
						foreach($arr as $item) $retDados[$item] = $response[$item];
					} else {
						$retDados[$detail] = $response[$detail];
					}
					$response = $retDados;
				}

			} else {
				$response = moduleList();
			}
			break;

		case 'POST':
		case 'PUT':
			if(empty($api->arrBody)) {
				$api->die400();
			} else {
				$response = moduleSave($api->idModule, $api->arrBody);
			}
			break;

		case 'DELETE':
			$response = moduleDelete($api->idModule);
			break;

		default:
			$api->die408();
	}

	if($response === false) {
		R4::dieAPI(0, $module->errMsg, $module->errObs);
	} else {
		echo json_encode($response);
	}

	require R4PHP .'r4iniend.php';
}