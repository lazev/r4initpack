<?php

class Users {

	public $errMsg    = '';
	public $errObs    = '';
	public $errFields = [];

	public function read($id) {
		global $db;

		$id = (int)$id;

		if(!$id) {
			$this->errMsg = 'Não foi possível detalhar o usuário';
			$this->errObs = 'Não foi informado o código do registro';
			return false;
		}

		//O uso de variáveis como :id e a matriz com valores
		//passado no segundo parâmetro da função sql ajuda a
		//evitar o uso de SQL Injections. Uso opcional.
		$dados = $db->sql("
			select *
			from `users`
			where id = :id
			limit 1
		", [
			'id' => $id
		]);

		unset($dados['pass']);

		return $dados;
	}


	public function save($id, $dados) {

		$id = (int)$id;

		$new = [
			'nome'    => $dados['nome'],
			'user'    => $dados['user'],
			'fones'   => $dados['fones'],
			'emails'  => $dados['emails'],
			'tags'    => $dados['tags'],
			'cpfcnpj' => $dados['cpfcnpj'],
			'idTipo'  => (int)$dados['idTipo'],
			'salario' => (double)$dados['salario'],
			'cep'     => $dados['cep'],
			'dtNasc'  => $dados['dtNasc'],
			'ativo'   => $dados['ativo']
		];

		if($id) {
			if($dados['pass']) {
				$new['pass'] = $this->criptPass($dados['pass']);
			}

			$id = $this->update($id, $new);

		} else {
			$new['pass'] = $this->criptPass($dados['pass']);

			$id = $this->insert($new);
		}

		if($id === false) return false;

		return [
			'id' => $id
		];
	}


	public function insert($new) {
		global $db;

		if($this->validFields($new, 'users') === false)
			return false;

		$check = $db->sql('insert into `users`', $new);

		if($check === false) {
			$this->errMsg = 'Erro ao inserir o usuário';
			$this->errObs = '';
			return false;
		}

		$id = $db->getInsertId();

		if($id === false || $id < 1) {
			$this->errMsg = 'Erro ao inserir o usuário';
			$this->errObs = '';
			return false;
		}

		if(isset($new['pass'])) $new['pass'] = '(oculto)';

		Log::inseriu('users', $id, $new);

		return $id;
	}


	public function update($id, $new) {
		global $db;

		$id = (int)$id;

		$old = $db->sql("
			select *
			from `users`
			where id = $id
			limit 1
		");

		$arr = R4::mergeNewArr($old, $new);
		$new = $arr['merged'];
		$alt = $arr['changed'];

		if($this->validFields($new, 'users') === false)
			return false;

		$retdb = $db->sql("
			update `users`
			set [fields]
			where id = $id
		", $new);

		if($retdb === false) {
			$this->errMsg = 'Erro ao atualizar o usuário';
			$this->errObs = '';
			return false;
		}

		if(isset($alt['pass'])) $alt['pass'] = '(oculto)';

		Log::alterou('users', $id, $alt);

		return $id;
	}


	private function validFields($dados, $prefix='users') {

		require_once R4PHP .'validFields.class.php';
		$validFields = new ValidFields;
		$validFields->addSchema(dirname(__FILE__) .'/fields.json', $prefix);

		if(!$validFields->valid($dados)) {
			$this->errMsg    = $validFields->errMsg;
			$this->errObs    = $validFields->errObs;
			$this->errFields = $validFields->getValidateErrors();
			return false;
		}

		return true;
	}


	public function delete($ids) {
		global $db;

		$listId = R4::intArray($ids);

		$strId = implode(', ', $listId);

		$users = $db->sql("
			select id, excluido
			from `users`
			where id in ($strId)
		");

		foreach($users as $key => $item) {
			$list[ $item['id'] ] = $item;
		}

		$deleted = [];
		$alert   = [];

		foreach($listId as $id) {

			if(!$list[$id]['id']) {
				$alert[$id] = 'Item não encontrado';
				continue;
			}

			if($list[$id]['excluido'] == 1) {
				$alert[$id] = 'Item já excluído antes';
				continue;
			}

			$ret = $db->sql("
				update `users`
				set
					dtDel = now(),
					excluido = 1
				where id = $id
			");

			if($ret === false) {
				$alert[$id] = 'Erro na exclusão do item';
				continue;
			}

			$deleted[] = $id;
		}

		foreach($deleted as $id) Log::excluiu('users', $id);

		return [
			'deleted' => $deleted,
			'alert'   => $alert
		];
	}


	public function undel($ids) {
		global $db;

		$listId = R4::intArray($ids);

		$strId = implode(', ', $listId);

		$users = $db->sql("
			select id, excluido
			from `users`
			where id in ($strId)
		");

		foreach($users as $key => $item) {
			$list[ $item['id'] ] = $item;
		}

		$recovered = [];
		$alert = [];

		foreach($listId as $id) {

			if(!$list[$id]['id']) {
				$alert[$id] = 'Item não encontrado';
				continue;
			}

			if($list[$id]['excluido'] != 1) {
				$alert[$id] = 'Item não estava excluído';
				continue;
			}

			$ret = $db->sql("
				update `users`
				set
					dtDel = '0000-00-00 00:00:00',
					excluido = 0
				where id = $id
			");

			if($ret === false) {
				$alert[$id] = 'Erro na recuperação do item';
				continue;
			}

			$recovered[] = $id;
		}

		foreach($recovered as $id) Log::gravar('Recuperou', 'users', $id);

		return [
			'recovered' => $recovered,
			'alert'     => $alert
		];
	}


	public function list($listFilter=[], $listParams=[]) {
		global $db;

		$params = $this->listFilter($listFilter, $listParams);

		$currentPage = $params['currentPage'];
		$regPerPage  = $params['regPerPage'];
		$strFilter   = $params['strFilter'];
		$descrFilter = $params['descrFilter'];

		$bindFilter  = $params['bindFilter'];

		$limit       = $params['limit'];
		$orderBy     = $params['orderBy'];

		//$db->setDebug(1); //mostra o SQL na tela

		$list = $db->sql("
			select id, user, nome, fones, tags, ativo
			from `users`
			where excluido = 0
			$strFilter
			order by $orderBy
			limit $limit
		", $bindFilter);


		$count = $db->sql("
			select count(*) as 'total'
			from `users`
			where excluido = 0
			$strFilter
			limit 1
		", $bindFilter);


		$info = [
			'orderBy'     => $orderBy,
			'currentPage' => $currentPage,
			'regPerPage'  => $regPerPage,
			'totalReg'    => (int)$count['total'],
			'descrFilter' => $descrFilter
		];

		return [
			'list' => $list,
			'info' => $info
		];
	}


	private function listFilter($listFilter=[], $listParams=[]) {

		if(!is_array($listParams)) $listParams = [];
		if(!is_array($listFilter)) $listFilter = [];

		$currentPage = @$listParams['currentPage'] ?: 1;
		$regPerPage  = @$listParams['regPerPage']  ?: 15;
		$limit       = R4::getLimit($currentPage, $regPerPage);
		$orderBy     = R4::getOrderBy($listParams['orderBy'], 'nome');
		$arrFilter   = [];
		$bindFilter  = [];
		$descrFilter = [];


		$filter = trim(@$listFilter['busca'] ?: '');
		if($filter) {

			$arrFilter[] = "and (
				id = :buscaExata
				or nome like :buscaLike
				or user like :buscaLike
				or concat(',', tags, ',') like :buscaTags
				or fones like :buscaLike
				or emails like :buscaLike
			)";

			$bindFilter['buscaExata']  = $filter;
			$bindFilter['buscaLike']   = '%'.  $filter .'%';
			$bindFilter['buscaTags']   = '%,'. $filter .',%';
			$descrFilter['Busca'] = $filter;
		}

		return [
			'limit'       => $limit,
			'orderBy'     => $orderBy,
			'currentPage' => $currentPage,
			'regPerPage'  => $regPerPage,
			'strFilter'   => (count($arrFilter)) ? implode(' ', $arrFilter) : '',
			'bindFilter'  => $bindFilter,
			'descrFilter' => $descrFilter
		];
	}


	private function criptPass($pass) {
		return password_hash($pass . SECRETKEY, PASSWORD_DEFAULT);
	}


	private function validPass($pass, $hash) {
		return password_verify($pass . SECRETKEY, $hash);
	}
}