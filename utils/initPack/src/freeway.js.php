<?php
header('Content-Type: application/javascript');

require_once 'config.inc.php';

echo 'const _CONFIG = '. json_encode([
	'rootURL' => ROOT_URL
]);