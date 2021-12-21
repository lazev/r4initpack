<?php

class Vendas {

	public $errMsg = '';
	public $errObs = '';

	public function read($id) {
		global $db;

		$id = (int)$id;

		if(!$id) {
			$this->errMsg = 'Não foi possível detalhar a venda';
			$this->errObs = 'Não foi informado o código do registro';
			return false;
		}

		$dados = $db->sql("
			select *
			from `vendas`
			where id = $id
			limit 1
		");

		return $dados;
	}


	public function save($id, $dados) {
		global $db;

		$id = (int)$id;

		$new = [
			'codCliente'  => $dados['codCliente'],
			'codVendedor' => $dados['codVendedor'],
			'categoria'   => $dados['categoria'],
			'tags'        => $dados['tags'],
			'dtVenda'     => $dados['dtVenda'] ?: 'now()',
			'situacao'    => $dados['situacao'] ?: 10
		];

		if($id) {
			$id = $this->update($id, $new);
		} else {
			$id = $this->insert($new);
		}

		if($id === false) return false;

		return [
			'id' => $id
		];
	}

	public function insert($new) {
		global $db;

		require_once R4PHP .'validFields.class.php';
		$validFields = new ValidFields;
		if(!$validFields->valid($new, dirname(__FILE__) .'/fields.json')) {
			$this->errMsg    = $validFields->errMsg;
			$this->errObs    = $validFields->errObs;
			$this->errFields = $validFields->errFields;
			return false;
		}

		$db->sql('insert into `vendas`', $new);

		$id = $db->getInsertId();

		if($id === false) {
			$this->errMsg = 'Erro ao inserir a venda';
			$this->errObs = '';
			return false;
		}

		return $id;
	}


	public function update($id, $new) {
		global $db;

		$old = $db->sql("
			select *
			from `vendas`
			where id = $id
			limit 1
		");

		$arr = R4::mergeNewArr($old, $new);
		$new = $arr['merged'];
		$alt = $arr['changed'];

		require_once R4PHP .'validFields.class.php';
		$validFields = new ValidFields;
		if(!$validFields->valid($new, dirname(__FILE__) .'/fields.json')) {
			$this->errMsg    = $validFields->errMsg;
			$this->errObs    = $validFields->errObs;
			$this->errFields = $validFields->errFields;
			return false;
		}

		$retdb = $db->sql("
			update `vendas`
			set [fields]
			where id = $id
		", $new);

		if($retdb === false) {
			$this->errMsg = 'Erro ao atualizar a venda';
			$this->errObs = '';
			return false;
		}

		return $id;
	}


	public function delete($ids) {
		global $db;

		$listId = R4::intArray($ids);

		$strId = implode(', ', $listId);

		$vendas = $db->sql("
			select id, ativo
			from `vendas`
			where id in ($strId)
		");

		foreach($vendas as $key => $item) {
			$list[ $item['id'] ] = $item;
		}

		$deleted = [];
		$alert   = [];

		foreach($listId as $id) {

			if(!$list[$id]['id']) {
				$alert[$id] = 'Item não encontrado';
				continue;
			}

			if($item['ativo'] == 0) {
				$alert[$id] = 'Item já excluído antes';
				continue;
			}

			$ret = $db->sql("
				update `vendas`
				set
					dtDel = now(),
					ativo = 0
				where id = $id
			");

			if($ret === false) {
				$alert[$id] = 'Erro na exclusão do item';
				continue;
			}

			$deleted[] = $id;
		}

		return [
			'deleted' => $deleted,
			'alert'   => $alert
		];
	}


	public function undel($ids) {
		global $db;

		$listId = R4::intArray($ids);

		$strId = implode(', ', $listId);

		$vendas = $db->sql("
			select id, ativo
			from `vendas`
			where id in ($strId)
		");

		foreach($vendas as $key => $item) {
			$list[ $item['id'] ] = $item;
		}

		$recovered = [];
		$alert   = [];

		foreach($listId as $id) {

			if(!$list[$id]['id']) {
				$alert[$id] = 'Item não encontrado';
				continue;
			}

			if($item['ativo'] != 0) {
				$alert[$id] = 'Item não estava excluido';
				continue;
			}

			$ret = $db->sql("
				update `vendas`
				set
					dtDel = NULL,
					ativo = 1
				where id = $id
			");

			if($ret === false) {
				$alert[$id] = 'Erro na recuperação do item';
				continue;
			}

			$recovered[] = $id;
		}

		return [
			'recovered' => $recovered,
			'alert'     => $alert
		];
	}


	public function list($listFilter=[], $listParams=[]) {
		global $db;

		$params = $this->listFilter($listFilter, $listParams);

		$limit       = $params['limit'];
		$orderBy     = $params['orderBy'];
		$currentPage = $params['currentPage'];
		$regPerPage  = $params['regPerPage'];
		$strFilter   = $params['strFilter'];

		//$db->setDebug(1);

		$list = $db->sql("
			select *
			from `vendas`
			where ativo = 1
			$strFilter
			order by $orderBy
			limit $limit
		");

		$count = $db->sql("
			select count(*) as 'total'
			from `vendas`
			where ativo = 1
			$strFilter
			limit 1
		");

		$info = [
			'orderBy'     => $orderBy,
			'currentPage' => $currentPage,
			'regPerPage'  => $regPerPage,
			'totalReg'    => (int)$count['total']
		];

		return [
			'list' => $list,
			'info' => $info
		];
	}


	private function listFilter($listFilter=[], $listParams=[]) {

		if(!is_array($listParams)) $listParams = [];
		if(!is_array($listFilter)) $listFilter = [];

		$arrFilter   = [];
		$orderBy     = @$listParams['orderBy']     ?: 'dtVenda desc';
		$currentPage = @$listParams['currentPage'] ?: 1;
		$regPerPage  = @$listParams['regPerPage']  ?: 15;
		$limit       = $regPerPage*($currentPage-1) .','. $regPerPage;

		//Filters

		$filter = @$listFilter['busca'] ?: false;
		if($filter) {
			$arrFilter[] = "(id = $filter or busca like '%$filter%')";
		}

		$filter = @$listFilter['categoria'] ?: false;
		if($filter) {
			$arrFilter[] = "categoria like '%$filter%'";
		}

		return [
			'limit'       => $limit,
			'orderBy'     => $orderBy,
			'currentPage' => $currentPage,
			'regPerPage'  => $regPerPage,
			'strFilter'   => (count($arrFilter)) ? implode(' and ', $arrFilter) : ''
		];
	}
}