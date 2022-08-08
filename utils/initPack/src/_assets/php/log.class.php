<?php
class Log {

	public $errMsg = '';
	public $errObs = '';

	public static function inseriu($modulo, $idModulo, $obs='') {
		return Log::gravar('Inseriu', $modulo, $idModulo, $obs);
	}


	public static function alterou($modulo, $idModulo, $obs='') {
		if(!empty($obs)) {
			return Log::gravar('Alterou', $modulo, $idModulo, $obs);
		}
	}


	public static function excluiu($modulo, $idModulo, $obs='') {
		return Log::gravar('Excluiu', $modulo, $idModulo, $obs);
	}


	public static function erro($modulo, $idModulo, $msg='', $obs='', $errFields=[]) {
		$msg = $msg . (($obs) ? ' - '. $obs : '');
		if($errFields) $msg = $msg .' '. json_encode($errFields);
		return Log::gravar('Erro', $modulo, $idModulo, $msg);
	}


	public static function gravar($msg, $modulo='', $idModulo=0, $obs='', $interno=0, $stripTags=true) {
		global $db;

		$user = (defined('APIUSER') && !empty(APIUSER)) ? APIUSER : R4::getSession('userUser');

		if(!$user) $user = '';

		$db->sql(
			"insert into `eventos`",
			[
				'idModulo' => $idModulo,
				'modulo'   => $modulo,
				'user'     => $user,
				'msg'      => $msg,
				'obs'      => (is_array($obs)) ? json_encode($obs) : $obs,
				'pid'      => getmypid() .'@'. UNIXTIME,
				//'interno'  => ($interno === 1) ? 1 : 0)
			]
			, $stripTags
		);
	}
}