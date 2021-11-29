<?php

class Api {

	public $errMsg = '';
	public $errObs = '';

	public $method = '';
	public $arrBody = [];
	public $idModule = '';
	public $detailModule = '';

	public $situAcesso = [
		10 => 'Acesso OK',
		30 => 'Conta inválida',
		40 => 'Conta bloqueada',
		50 => 'Token inválido',
		60 => 'API bloqueada',
		70 => 'Muitas requisições'
	];

	private $allowedMethods = ['HEAD', 'DELETE', 'POST', 'GET', 'PUT', 'OPTIONS'];

	public function setBodyContent($content) {
		$this->arrBody = json_decode($content, 1);
	}

	public function setIdModule($id) {
		$this->idModule = $id;
	}

	public function setDetailModule($detail) {
		$this->detailModule = $detail;
	}

	public function setMethod($method) {
		$method = strtoupper($method);
		if(!in_array($method, $this->allowedMethods)) {
			return false;
		}

		$this->method = $method;

		return true;
	}


	public function grantAccess($user, $pass) {
		global $db;

		error_log('Efetuando acesso...');

		$idConta = (int)str_replace('id', '', $user);

		$serverDB = $this->getFastAccess($user, $pass);

		error_log('Pos fast access: '. $serverDB);

		if($serverDB === false) {
			$serverDB = $this->getDBAccess($user, $pass, $idConta);

			error_log('Pos DB access: '. $serverDB);
		}

		if($serverDB === false) return false;

		$this->setFastAccess($user, $pass, $serverDB);

		error_log('Conectou '. $serverDB .' e '. $idConta);

		$db->connect($serverDB, 'la_'. $idConta);

		return true;
	}


	private function getDBAccess($user, $pass, $idConta) {
		global $db;

		if(!$idConta) {
			$this->registerAccess(['user' => $user, 'pass'=> $pass, 'situacao' => 30]); //Conta inválida
			return false;
		}

		$db->connect(INDEXDB, INDEXTABLE);

		$veri = $db->sql("
			select serverDB, tokenAPI, bloqueadoAPI, bloqueado, ativo
			from `contas`
			where id = $idConta
			limit 1
		");

		if(!$veri['tokenAPI']) {
			$this->registerAccess(['user' => $user, 'pass'=> $pass, 'situacao' => 30]); //Conta inválida
			return false;
		}

		if(($veri['bloqueado'] == 1) || ($veri['ativo'] == 0)) {
			$this->registerAccess(['user' => $user, 'pass'=> $pass, 'situacao' => 40]); //Conta bloqueada ou excluída
			return false;
		}

		if(!hash_equals($veri['tokenAPI'], $pass)) {
			$this->registerAccess(['user' => $user, 'pass'=> $pass, 'situacao' => 50]); //Token inválido
			return false;
		}

		if($veri['bloqueadoAPI'] == 1) {
			$this->registerAccess(['user' => $user, 'pass'=> $pass, 'situacao' => 60]); //API bloqueada
			return false;
		}

		$this->registerAccess(['user' => $user, 'pass'=> $pass, 'situacao' => 10]); //Acesso Ok

		return $veri['serverDB'];
	}


	private function setFastAccess($user, $pass, $serverDB) {

		$redis = $this->connectRedis();
		if($redis === false) {
			error_log('Erro ao conectar o REDIS do Fast Access');
			return false;
		}

		$key = USER_IP .'|'. $user;
		$value = $pass .'|'. $serverDB;

		$redis->set($key, $value);
		$redis->expire($key, 1200);

		return true;
	}


	private function getFastAccess($user, $pass) {

		$redis = $this->connectRedis();
		if($redis === false) {
			error_log('Erro ao conectar o REDIS do Fast Access');
			return false;
		}

		$key = USER_IP .'|'. $user;

		if($redis->exists($key)) {
			$value = explode('|', $redis->get($key));

			if(hash_equals($value[0], $pass)) {
				return $value[1];
			}
		}

		return false;
	}


	private function connectRedis() {
		if(!class_exists('Redis')) return false;

		$redis = new Redis();
		$ret = $redis->connect('127.0.0.1', 6379);
		//$redis->auth('REDIS_PASSWORD');

		if(!$redis->ping()) return false;

		return $redis;
	}


	public function checkRequestRateByIP($params) {

		$maxCalls  = $params['maxCalls'];
		$secPeriod = $params['secPeriod'];
		$user      = $params['user'];
		$pass      = $params['pass'];

		$redis = $this->connectRedis();
		if($redis === false) {
			error_log('Erro ao conectar o REDIS que verifica a taxa de requests da API');
			//Se o Redis não foi encontrado, pula essa validação
			return true;
		}

		$totalCalls = 0;

		$key = 'flood'. $secPeriod . USER_IP;

		if(!$redis->exists($key)) {
			 $redis->set($key, 1);
			 $redis->expire($key, $secPeriod);
			 $totalCalls = 1;
		} else {
			 $redis->INCR($key);
			 $totalCalls = $redis->get($key);
			 if($totalCalls > $maxCalls) {
				 $this->registerAccess([
					 'user'      => $user,
					 'pass'      => $pass,
					 'secPeriod' => $secPeriod,
					 'situacao'  => 70
				]);
				return false;
			 }
		}

		return true;
	}


	private function registerAccess($params) {
		global $db;

		$db->connect(INDEXDB, INDEXTABLE);

		$secPeriod = (isset($params['secPeriod'])) ? $params['secPeriod'] : 0;

		$db->sql("insert into `apiAccessLog`", [
			'ip'        => USER_IP,
			'user'      => $params['user'] ?: '',
			'iniPass'   => substr($params['pass'], 0, 20) ?: '',
			'floodTime' => $secPeriod,
			'situacao'  => $params['situacao']
		]);
	}


	public function die400() {
		header('WWW-Authenticate: Basic realm="Bad request"');
		header('HTTP/1.0 400 Bad Request');

		echo json_encode([
			'error' => 1,
			'message' => 'Bad Request 400!'
		]);
		exit;
	}

	public function die401() {
		header('WWW-Authenticate: Basic realm="Authentication required"');
		header('HTTP/1.0 401 Unauthorized');

		echo json_encode([
			'error' => 1,
			'message' => 'Access denied 401!'
		]);
		exit;
	}

	public function die405() {
		header('WWW-Authenticate: Basic realm="Valid method required"');
		header('HTTP/1.0 405 Method Not Allowed');

		echo json_encode([
			'error' => 1,
			'message' => 'Method Not Allowed 405!'
		]);
		exit;
	}

	public function die415() {
		header('WWW-Authenticate: Basic realm="Application/json required"');
		header('HTTP/1.0 415 Unsupported Media Type');

		echo json_encode([
			'error' => 1,
			'message' => 'Unsupported Media Type 415!'
		]);
		exit;
	}

	public function die418() {
		header('WWW-Authenticate: Basic realm="Server error"');
		header('HTTP/1.0 418 Im a teapot');

		echo json_encode([
			'error' => 1,
			'message' => 'Im a teapot 418!'
		]);
		exit;
	}

	public function die429() {
		header('WWW-Authenticate: Basic realm="Request rate is 10/sec"');
		header('HTTP/1.0 429 Too Many Requests');

		echo json_encode([
			'error' => 1,
			'message' => 'Too Many Requests 429!'
		]);
		exit;
	}
}