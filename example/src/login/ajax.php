<?php
require '../config.inc.php';
require R4PHP .'r4iniend.php';

require ROOT .'login/login.class.php';

$login = new Login;

$db->connect(INDEXDB, INDEXTABLE);

switch($_REQUEST['com']) {

case 'getInit':

	require_once 'providers/facebook.php';
	$fb = new Facebook;

	require_once 'providers/google.php';
	$gg = new Google;

	$logged = R4::getSession('userLogged');

	if(!$logged) $logged = $login->checkKeepLogged();

	R4::retOkAPI([
		'logged'    => $logged,
		'fbAuthUrl' => $fb->getAuthorizationUrl(),
		'ggAuthUrl' => $gg->getAuthorizationUrl()
	]);

	break;


case 'login':

	$idUser = $login->check([
		'user' => $_REQUEST['user'],
		'pass' => $_REQUEST['pass'],
		'save' => $_REQUEST['save']
	]);

	if($idUser === false) {
		die(json_encode([
			'error'  => 1,
			'errMsg' => $login->errMsg,
			'errObs' => $login->errObs
		]));
	}

	R4::retOkAPI([
		'logged' => 1
	]);

	break;


default:
	R4::dieAPI(0, 'Nenhum comando vรกlido informado');
}

require R4PHP .'r4iniend.php';