<?php

class Usuarios {

	public $errMsg = '';
	public $errObs = '';
	
	private $idConta         = 0;
	private $strListaIdUsers = '';
	
	public function setUsersConta($idConta) {
		global $db;
		
		$idConta = (int)$idConta;
		
		if(!$idConta) {
			$this->errMsg = 'Erro ao buscar informações dos usuários';
			$this->errObs = 'Não foi possível definir a conta';
			return false;
		}

		$users = $db->sql("
			select id
			from `usuariosContas`
			where idConta = $idConta
		");

		$arr = [];
		foreach($users as $user) $arr[] = $user['id'];

		$this->strListaIdUsers = implode(',', $arr);
		$this->idConta = $idConta;

		return true;
	}


	public function read($idUser) {
		global $db;

		$idUser = (int)$idUser;

		if(!$idUser) {
			$this->errMsg = 'Não foi possível detalhar o usuário';
			$this->errObs = 'Não foi informado o código do registro';
			return false;
		}

		$dados = $db->sql("
			select A.*, B.dono, B.situAcesso
			from `usuarios` A, `usuariosContas` B
			where A.id    = $idUser
			and A.id      = B.idUsuario
			and B.idConta = {$this->idConta}
			limit 1
		");

		return $dados;
	}


	public function save($idUser, $dados) {
		global $db;

		$idUser = (int)$idUser;

		//INSERT
		if(!$idUser) {
			$new = [
				'nome'   => $dados['nome'],
				'fones'  => $dados['fones'],
				'emails' => $dados['emails'],
				'tags'   => $dados['tags']
			];

			$idUser = $db->insert('usuarios', $new);

			if($idUser === false) {
				$this->errMsg = 'Erro ao salvar o Usuario';
				$this->errObs = '';
				return false;
			}
			
			$idUserConta = $db->insert('usuariosContas', [
				'idUsuario' => $idUser,
				'idConta'   => $this->idConta,
				'situAcesso' => 50
			]);
		}

		//UPDATE
		else {
			$old = $db->sql("
				select *
				from `usuarios`
				where id = $idUser
				and id in ({$this->strListaIdUsers})
			");
			
			if(!$old['id']) {
				$this->errMsg = 'Não foi possível localizar o usuário para salvar a edição';
				$this->errObs = 'O usuário código '. $idUser .' não faz parte desta conta';
				return false;
			}

			$alt = [
				'nome'   => $dados['nome'],
				'fones'  => $dados['categoria'],
				'emails' => $dados['preco'],
				'tags'   => $dados['tags']
			];

			$retdb = $db->sql("
				update `usuarios`
				set [fields]
				where id = $idUser
				and id in ({$this->$strListaIdUsers})
			", $alt);
		}

		return [
			'id' => $idUser
		];
	}


	private function listFilter($listFilter=[], $listParams=[]) {

		if(!is_array($listParams)) $listParams = [];
		if(!is_array($listFilter)) $listFilter = [];

		$arrFilter   = [];
		$orderBy     = @$listParams['orderBy']     ?: 'nome';
		$currentPage = @$listParams['currentPage'] ?: 1;
		$regPerPage  = @$listParams['regPerPage']  ?: 15;
		$limit       = $regPerPage*($currentPage-1) .','. $regPerPage;

		//Filters

		$filter = @$listFilter['busca'] ?: false;
		if($filter) {
			$arrFilter[] = "(id = $filter or busca like '%$filter%')";
		}

		return [
			'limit'       => $limit,
			'orderBy'     => $orderBy,
			'currentPage' => $currentPage,
			'regPerPage'  => $regPerPage,
			'strFilter'   => (count($arrFilter)) ? implode(' and ', $arrFilter) : ''
		];
	}


	public function list($listFilter, $listParams) {
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
			from `usuarios`
			where ativo = 1
			and id in ({$this->strListaIdUsers})
			$strFilter
			order by $orderBy
			limit $limit
		");

		$count = $db->sql("
			select count(*) as 'total'
			from `usuarios`
			where ativo = 1
			and id in ({$this->strListaIdUsers})
			$strFilter
			limit 1
		");

		$info = [
			'orderBy'     => $orderBy,
			'currentPage' => $currentPage,
			'regPerPage'  => $regPerPage,
			'totalReg'    => $count['total']
		];

		return [
			'list' => $list,
			'info' => $info
		];
	}


	public function delete($ids) {
		global $db;

		$listId = R4::intArray($ids);

		$strId = implode(', ', $listId);

		$usuarios = $db->sql("
			select A.id, A.ativo, B.dono
			from `usuarios` A, `usuariosContas` B
			where A.id in ($strId)
			and A.id = B.idUsuario
			and B.idConta = {$this->idConta}
		");

		foreach($usuarios as $key => $item) {
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

			if($list[$id]['dono']) {
				$alert[$id] = 'Não é possível excluir o dono da conta';
				continue;
			}

			$ret = $db->sql("
				update `usuarios`
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
}