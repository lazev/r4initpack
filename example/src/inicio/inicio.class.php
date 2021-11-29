<?php

class Inicio {

	public $errMsg = '';
	public $errObs = '';

	public function salvarNome($idUser, $nome) {
		global $db;

		$idUser = (int)$idUser;

		if(!$idUser){
			$this->errMsg = 'Código não informado';
			$this->errObs = 'Não foi possível identificar o código do cadastro';
			return false;
		}

		if(!$nome){
			$this->errMsg = 'Nome em branco';
			$this->errObs = 'O nome não pode ficar em branco';
			return false;
		}

		$db->sql("
			update `usuarios`
			set nome = '$nome'
			where id = $idUser
			limit 1
		");

		$usuario = $db->sql("
			select nome
			from `usuarios`
			where id = $idUser
			limit 1
		");

		return $usuario;
	}


	public function listarContas($idUser) {
		global $db;

		$idUser = (int)$idUser;

		$ret = $db->sql("
			select A.*
			from `contas` A, `usuariosContas` B
			where B.idUsuario = $idUser
			and B.idConta = A.id
		");

		return $ret;
	}


	public function selConta($idUser, $idConta) {
		global $db;

		$idUser  = (int)$idUser;
		$idConta = (int)$idConta;

		$ret = $db->sql("
			select id, situAcesso
			from `usuariosContas`
			where idConta = $idConta
			and idUsuario = $idUser
			limit 1
		");

		if(!$ret['id']) {
			$this->errMsg = 'Não foi possível localizar a conta';
			$this->errObs = 'Não há nenhuma conta de código '. $idConta .' para seu usuário';
			return false;
		}

		if($ret['situAcesso'] == 90) {
			$this->errMsg = 'Não foi possível acessar a conta';
			$this->errObs = 'O acesso deste usuário está bloqueado';
			return false;
		}

		$conta = $db->sql("
			select serverDB, bloqueado, ativo
			from `contas`
			where id = $idConta
			limit 1
		");

		if($conta['bloqueado']) {
			$this->errMsg = 'Não foi possível acessar a conta';
			$this->errObs = 'O acesso desta conta está bloqueado';
			return false;
		}

		if($conta['ativo'] == 0) {
			$this->errMsg = 'Não foi possível acessar a conta';
			$this->errObs = 'Esta conta foi inativada no sistema';
			return false;
		}

		$check = $db->connect($conta['serverDB'], 'la_'. $idConta);
		if($check === false) {
			$this->errMsg = 'Erro ao selecionar a base da conta';
			$this->errObs = 'A base da conta informada não foi encontrada';
			return false;
		}

		return $ret['id'];
	}


	public function inserirConta($idUser, $contaNome='') {
		global $db;

		if(!(int)$idUser){
			$this->errMsg = 'Código não informado';
			$this->errObs = 'Não foi possível identificar o código do usuário';
			return false;
		}

		$ret = $db->sql("insert into `contas`", [
			'serverDB'   => NEWACCOUNTSDB,
			'nome'       => $contaNome,
			'tokenAPI'   => base64_encode(random_bytes(64))
		]);

		if($ret === false) {
			$this->errMsg = 'Erro ao criar a nova conta';
			$this->errObs = 'Não foi possível criar uma nova conta na base';
			return false;
		}

		$idConta = $db->getInsertId();

		$conta = $db->sql("
			select id, nome, dtCad, dtAcesso
			from `contas`
			where id = $idConta
			limit 1
		");

		$db->sql("insert into `usuariosContas`", [
			'idConta'    => $idConta,
			'idUsuario'  => $idUser,
			'dono'       => 1,
			'situAcesso' => 50
		]);

		$db->connect(NEWACCOUNTSDB);


		require_once ROOT .'inicio/database.class.php';
		$database = new Database;
		$database->setNameDB($idConta);

		$check = $database->createDB();
		if($check === false) {
			$this->errMsg = $database->errMsg;
			$this->errObs = $database->errObs;
			return false;
		}

		$check = $database->createTables();
		if($check === false) {
			$this->errMsg = $database->errMsg;
			$this->errObs = $database->errObs;
			return false;
		}

		$db->connect(INDEXDB, INDEXTABLE);

		if(empty($conta['nome'])) {

			$nome = 'Conta id #'. $idConta;

			$db->sql("
				update `contas`
				set nome = '$nome'
				where id = $idConta
				limit 1
			");

			$conta['nome'] = $nome;
		}

		return $conta;
	}
}