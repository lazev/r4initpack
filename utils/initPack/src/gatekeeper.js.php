<?php
require_once 'config.inc.php';

//Verifica se o usuário tá logado, se não, vai para a tela de login
if(!isset($_SESSION[SYSTEMID]) || !count($_SESSION[SYSTEMID]) || !$_SESSION[SYSTEMID]['userLogged']) {
	echo 'window.location = "'. ROOT_URL .'login/";';
}


//Se estiver logado, verifica se tá dentro de uma empresa, se não, vai para a tela de seleção
elseif(
	!isset($_REQUEST['selconta']) &&
	(!isset($_SESSION[SYSTEMID]['idConta']) || !isset($_SESSION[SYSTEMID]['SELTABLE']))
) {
	echo 'window.location = "'. ROOT_URL .'inicio/"';
}


//Se tudo ok, segue adiante
else {
	require_once 'freeway.js.php';
}