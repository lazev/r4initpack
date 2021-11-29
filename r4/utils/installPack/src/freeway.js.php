<?php
require_once 'config.inc.php';

$arr = [
	'rootURL' => ROOT_URL
];

echo 'const _CONFIG = '. json_encode($arr);