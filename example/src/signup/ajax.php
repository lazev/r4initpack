<?php
require '../config.inc.php';
require R4PHP .'r4iniend.php';

require ROOT .'signup/signup.class.php';

$signUp = new SignUp;

switch($_REQUEST['com']) {

	case 'save':

		$ret = $signUp->save([
			'user'  => $_REQUEST['user'],
			'pass'  => $_REQUEST['pass'],
			'pass2' => $_REQUEST['pass2']
		]);

		if($ret === false) {
			R4::dieAPI($signUp->errCod, $signUp->errMsg, $signUp->errObs);
		}

		R4::retOkAPI($ret);

	break;

	default:
		R4::dieAPI(0, 'Nenhum comando valido informado');
}


require R4PHP .'r4iniend.php';