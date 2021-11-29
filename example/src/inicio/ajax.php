<?php
require '../config.inc.php';
require R4PHP .'r4iniend.php';

require ROOT .'inicio/inicio.class.php';

$inicio = new Inicio;

$check = $db->connect(INDEXDB, INDEXTABLE);

if($check === false) {
	R4::dieAPI(0, $db->errMsg, $db->errObs);
}


switch($_REQUEST['com']) {

	case 'getInit':

		$contas = $inicio->listarContas(R4::getSession('idUser'));

		R4::retOkAPI([
			'contas' => $contas,
			'dados' => [
				'userNome' => R4::getSession('userNome')
			],
		]);

		break;


	case 'salvarNome':

		$id = R4::getSession('idUser');

		$ret = $inicio->salvarNome($id, $_REQUEST['val']);

		if($ret === false) {
			R4::dieAPI(0, $inicio->errMsg, $inicio->errObs);
		}

		R4::setSession('userNome', $ret['nome']);

		R4::retOkAPI([
			'dados' => [
				'userNome' => $ret['nome']
			]
		]);

		break;


	case 'inserirConta':

		$id = R4::getSession('idUser');

		$ret = $inicio->inserirConta($id, $_REQUEST['nome']);

		if($ret === false) {
			R4::dieAPI(0, $inicio->errMsg, $inicio->errObs);
		}

		R4::setSession('idConta', $ret['id']);

		R4::retOkAPI([
			'dados' => $ret
		]);

		break;


	case 'selConta':

		$idUser  = R4::getSession('idUser');
		$idConta = $_REQUEST['id'];

		$ret = $inicio->selConta($idUser, $idConta);

		if($ret === false) {
			R4::dieAPI(0, $inicio->errMsg, $inicio->errObs);
		}

		//R4::dieAPI(0, '$this->errMsg', '$this->errObs');

		R4::setSession('idConta', $idConta);
		R4::setSession('SELTABLE', 'la_'. $idConta);

		R4::retOkAPI();

		break;


	default:
		R4::dieAPI(0, 'Nenhum comando vรกlido informado');
}


require R4PHP .'r4iniend.php';