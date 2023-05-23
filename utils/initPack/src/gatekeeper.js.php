<?php
header('Content-Type: application/javascript');

require_once 'config.inc.php';

//Verifica se o usuário tá logado, se não, vai para a tela de login
if(!isset($_SESSION[SYSTEMID]) || !count($_SESSION[SYSTEMID]) || !$_SESSION[SYSTEMID]['userLogged']) {
	echo 'window.location = "'. ROOT_URL .'login/";';
}

//Se tudo ok, segue adiante
else {
	require_once 'freeway.js.php';
}