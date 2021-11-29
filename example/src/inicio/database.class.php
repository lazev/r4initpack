<?php

class Database {

	public $errMsg = '';
	public $errObs = '';

	private $dbname = '';
	private $dbprefix = 'la_';

	public function setNameDB($id) {

		$id = (int)$id;

		if(!$id) {
			$this->errMsg = 'Cód da conta não informado';
			$this->errObs = 'Não foi possível criar a conta';
			return false;
		}

		$this->dbname = $this->dbprefix . $id;
	}


	public function createDB() {
		global $db;

		$db->sql("create database `". $this->dbname ."` collate 'utf8mb4_general_ci';");

		if(!$db->connect(null, $this->dbname)) {
			$this->errMsg = 'Erro ao criar a conta '. $this->dbname;
			$this->errObs = $db->errCod .' - '. $db->errMsg;
			return false;
		}

		return true;
	}


	public function createTables() {
		global $db;

		$retcon = $db->connect(null, $this->dbname);
		if($retcon === false) {
			$this->errMsg = 'Não foi possível criar as tabelas da conta';
			$this->errObs = 'Erro ao conectar na conta '. $this->dbname;
		}

		$db->sql("
			CREATE TABLE `produtos` (
				`id` int(1) UNSIGNED NOT NULL AUTO_INCREMENT,
				`categoria` varchar(50) NULL,
				`nome` varchar(100) NOT NULL,
				`preco` decimal(10,2) UNSIGNED NOT NULL DEFAULT 0.00,
				`comEstoque` tinyint(1) NOT NULL DEFAULT 1,
				`tags` varchar(200) NULL,
				`dtCad` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP,
				`dtDel` datetime NULL,
				`ativo` tinyint(1) UNSIGNED NOT NULL DEFAULT 1,
				PRIMARY KEY (`id`)
			) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
		");

		R4::setSession('SELTABLE', $this->dbname);
	}
}