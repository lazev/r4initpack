<?php
if(!defined('R4ALREADYINIT')) {
	define('R4ALREADYINIT', true);

	if(isset($_CONFIG['requireLogin']) && $_CONFIG['requireLogin']) {
		if(!isset($_SESSION[SYSTEMID]) || !count($_SESSION[SYSTEMID]) || !$_SESSION[SYSTEMID]['userLogged']) {
			die('{ "error": 1, "status": 401, "errMsg": "Acesso não autorizado" }');
		}
	}

	if(isset($_CONFIG['requireReferer']) && $_CONFIG['requireReferer']) {
		$referer = ($_CONFIG['requireReferer'] === true && defined('ROOT_URL')) ? ROOT_URL : $_CONFIG['requireReferer'];
		if(empty($_SERVER['HTTP_REFERER']) || strpos($_SERVER['HTTP_REFERER'], $referer) === false) {
			header('HTTP/1.1 403 Forbidden');
			exit();
		}
	}

	if(!isset($_CONFIG['requireCsrf']) || $_CONFIG['requireCsrf'] !== false) {
		if(!isset($_SESSION[SYSTEMID]['_csrfToken'])) {
			$_SESSION[SYSTEMID]['_csrfToken'] = bin2hex(random_bytes(32));
		}

		if($_SERVER['REQUEST_METHOD'] === 'POST') {
			$token = $_SERVER['HTTP_X_CSRF_TOKEN'] ?? '';
			if($token !== $_SESSION[SYSTEMID]['_csrfToken']) {
				header('HTTP/1.1 403 Forbidden');
				die('{"error":1,"status":403,"errMsg":"Token CSRF inválido"}');
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