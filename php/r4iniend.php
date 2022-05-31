<?php
if(!defined('R4ALREADYINIT')) {
	define('R4ALREADYINIT', true);

	if(isset($_CONFIG) && $_CONFIG['requireLogin']) {
		if(!isset($_SESSION[SYSTEMID]) || !count($_SESSION[SYSTEMID]) || !$_SESSION[SYSTEMID]['userLogged']) {
			die('{ "error": 1, "status": 401, "errMsg": "Acesso não autorizado" }');
		}
	}

	require 'r4.class.php';
	require 'db.class.php';

	$db = new DB();

	if(defined('DBSERVER')) {
		$dbtable = (defined('DBTABLE')) ? DBTABLE : '';
		$db->connect(DBSERVER, $dbtable);
	}

	spl_autoload_register(function($className) {
		$className = strtolower($className);
		require ROOT . $className .'/'. $className .'.class.php';
	});

} else {

	if(isset($db)) {
		$db->close();
	}

}