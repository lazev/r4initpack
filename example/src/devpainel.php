<?php
require_once 'config.inc.php';

echo '<pre>';

echo USER_IP . PHP_EOL;

print_r($_SESSION);

print_r($_SERVER);

echo '</pre>';

phpinfo();