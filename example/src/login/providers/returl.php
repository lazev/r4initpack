<?php
require_once '../../config.inc.php';
require R4PHP .'r4iniend.php';


if(isset($_REQUEST['retfb'])) {
	require 'facebook.php';
	$provider = new Facebook;
}
elseif(isset($_REQUEST['retgg'])) {
	require 'google.php';
	$provider = new Google;
}
elseif(isset($_REQUEST['retig'])) {
	require 'instagram.php';
	$provider = new Instagram;
}
elseif(isset($_REQUEST['retli'])) {
	require 'linkedin.php';
	$provider = new Linkedin;
}
else {
	echo 'Nenhum provider encontrado';
}


if(isset($provider)) {
	if(isset($_REQUEST['error']) && $_REQUEST['error'] == 'access_denied') {

		header('location: '. ROOT_URL .'login/#access_denied');

	} else {

		if(isset($_REQUEST['code'])) {

			$token = $provider->getAccessToken('authorization_code', [
				'code' => $_REQUEST['code']
			]);

			if($token === false) {
				header('location: '. ROOT_URL .'login/#code_expired');
			}

			else {
				$params = $provider->getResourceOwner($token);
				//provider
				//providerId
				//name
				//emails
				//picture

				$db->connect(INDEXDB, INDEXTABLE);
				
				require_once ROOT .'login/login.class.php';
				$login = new Login;

				$ret = $login->checkProvider($params);

				//Se não tem cadastro...
				if($ret === false) {

					//Faz o cadastro
					require_once ROOT .'signup/signup.class.php';
					$signup = new Signup;

					$retnew = $signup->saveProvider($params);

					if(!$retnew['id']) {
						header('location: '. ROOT_URL .'login/#msg='. $login->errMsg .'&obs='. $login->errObs);
					} else {
						header('location: '. ROOT_URL .'inicio/');
					}
				} else {
					header('location: '. ROOT_URL .'inicio/');
				}
			}
		}
	}
}

require R4PHP .'r4iniend.php';