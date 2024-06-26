<?php
if(!defined('R4ALREADYINIT')) {
	define('R4ALREADYINIT', true);

	if(isset($_CONFIG['requireLogin']) && $_CONFIG['requireLogin']) {
		if(!isset($_SESSION[SYSTEMID]) || !count($_SESSION[SYSTEMID]) || !$_SESSION[SYSTEMID]['userLogged']) {
			die('{ "error": 1, "status": 401, "errMsg": "Acesso não autorizado" }');
		}
	}

	if(isset($_CONFIG['requireReferer'])) {
		if($_CONFIG['requireReferer']) {
			if(strpos($_SERVER['HTTP_REFERER'], $_CONFIG['requireReferer']) === false) {
				header('HTTP/1.1 403 Forbidden');
				exit();
			}
		}
	}


	require 'r4.class.php';
	require 'db.class.php';

	$db = new DB();

	if(defined('DBHOST')) {
		$dbbase = (defined('DBBASE')) ? DBBASE : '';
		$db->connect(DBHOST, $dbbase);
	}

	spl_autoload_register(function($className) {
		error_log($className .' chamado por spl_autoload_register');
		$className = strtolower($className);
		require ROOT . $className .'/'. $className .'.class.php';
	});

} else {

	if(isset($db)) {
		$db->close();
	}

}