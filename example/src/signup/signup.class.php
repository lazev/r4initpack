<?php
class SignUp {

	public $errCod = 0;
	public $errMsg = '';
	public $errObs = '';


	public function valid($params=[]) {
		global $db;

		$user  = $params['user'];
		$pass  = $params['pass'];
		$pass2 = $params['pass2'];

		if(empty($user)) {
			$this->errMsg = 'E-mail inválido';
			$this->errObs = 'É necessário informar um e-mail válido';
			return false;
		}

		if((empty($pass)) || ($pass != $pass2)) {
			$this->errMsg = 'Senha inválida';
			$this->errObs = 'É necessário informar a senha de acesso duas vezes';
			return false;
		}

		$veri = $db->sql("
			select id from `usuarios`
			where user='$user'
			limit 1
		");

		if($veri && $veri['id']) {
			$this->errMsg = 'Usuário já cadastrado';
			$this->errObs = 'O e-mail informado já está em uso';
			$this->errCod = 10;
			return false;
		}

		return true;
	}


	public function save($params=[]) {
		global $db;

		require_once ROOT .'login/login.class.php';
		$login = new Login;

		$user  = $params['user'];
		$pass  = $params['pass'];
		$pass2 = $params['pass2'];

		if(!$this->valid($params)) {
			return false;
		}

		$cpass = $login->criptPass($pass);

		$dados = [
			'provider' => 'email',
			'user'     => $user,
			'pass'     => $cpass,
			'emails'   => $user
		];

		$db->sql("insert into `usuarios`", $dados);

		$id = $db->getInsertId();

		$dados['id'] = $id;

		$login->setLoginOk($dados);

		return [
			'id'   => $id,
			'user' => $user
		];

	}


	public function saveProvider($params=[]) {
		global $db;

		require_once ROOT .'login/login.class.php';
		$login = new Login;

		$dados = [
			'provider'   => $params['provider'],
			'providerId' => $params['providerId'],
			'nome'       => $params['name'],
			'emails'     => $params['emails'],
			'picture'    => $params['picture']
		];

		$db->sql("insert into `usuarios`", $dados);

		$id = $db->getInsertId();

		$dados['id'] = $id;

		$login->setLoginOk($dados);

		return [
			'id'  => $id
		];
	}
}