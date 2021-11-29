<?php
require '../config.inc.php';

$_SESSION[SYSTEMID] = [];

setcookie('PHPSESSID', null, -1, '/');
setcookie('keepMeLogged', null, -1, '/');

header('location: '. ROOT_URL .'login/');