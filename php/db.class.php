<?php

class DB {

	private $DBCon;
	private $debug = false;
	private $currentHost = '';
	private $currentBase = '';
	private $currentUser = '';

	public $errCod = 0;
	public $errMsg = '';
	public $errCom = '';

	public $affectedRows = 0;

	public function connect($host='', $dbname='', $user='', $pass='', $errAlert=true, $ssl=false) {
		$this->errCod = 0;
		$this->errMsg = '';

		if(empty($user) && defined('DBUSER')) $user = DBUSER;
		if(empty($pass) && defined('DBPASS')) $pass = DBPASS;
		if(empty($ssl)  && defined('DBSSL') ) $ssl  = DBSSL;

		if(!empty($host)) {
			if($this->currentHost != $host || $this->currentUser != $user) {

				try {
					if($ssl) {
						$this->DBCon = mysqli_init();
						$this->DBCon->real_connect($host, $user, $pass, null, null, null, MYSQLI_CLIENT_SSL);
					} else {
						$this->DBCon = new mysqli($host, $user, $pass);
					}

				} catch (Exception $e) {

					$this->errCod = $e->getCode();
					$this->errMsg = $this->errCod .' - '. $e->getMessage();

					if($errAlert) $this->errorMonitor('Server '. $host .' connection error: '. $this->errMsg);

					return false;
				}

				if(!$this->DBCon->set_charset('utf8mb4')) {
					if($errAlert) {
						$this->errorMonitor(
							'Error loading character set utf8mb4: '
							. $this->DBCon->error
						);
					}
				}
				$this->DBCon->query("SET time_zone='". date('P') ."'");
				$this->currentHost = $host;
				$this->currentUser = $user;
				$this->currentBase = '';
			}
		}

		if(!empty($dbname)) {
			if($this->currentBase != $dbname) {

				try {

					$this->DBCon->select_db($dbname);

				} catch (Exception $e) {

					$this->errCod = $e->getCode();
					$this->errMsg = $this->errCod .' - '. $e->getMessage();

					if($errAlert) {
						$this->errorMonitor(
							'Base '. $dbname .' selection error on '.
							$this->currentHost .': '. $this->errMsg
						);
					}

					return false;
				}

				$this->currentBase = $dbname;
			}
		}

		return $this->DBCon;
	}


	public function sql($sqlQuery, $dataFields='', $errorAlert=true) {

		if(is_null($this->DBCon)) {
			$this->errCod = 400;
			$this->errMsg = 'Sem conexão com o banco de dados';
			$this->errCom = $sqlQuery;
			return false;
		}

		$sqlQuery  = trim($sqlQuery, " \n\r\t\v\x00;");
		preg_match('/^\s*(?:--[^\n]*(?:\n|$)|#[^\n]*(?:\n|$)|\/\*.*?\*\/\s*)*(\w+)/is', $sqlQuery, $m);
		$queryType = strtolower($m[1] ?? '');

		if(!empty($dataFields) && is_array($dataFields) && in_array($queryType, ['insert', 'update'])) {
			$fields = [];
			$values = [];

			foreach($dataFields as $field => $value) {
				if(empty($field)) continue;

				$fields[] = implode('.', array_map(
					fn($p) => '`' . str_replace('`', '', $p) . '`',
					explode('.', $field)
				));

				if($value === 'now()')
					$values[] = 'now()';
				elseif($value === null)
					$values[] = 'NULL';
				elseif(is_numeric($value))
					$values[] = "'$value'";
				else
					$values[] = "'". $this->real_escape_string($value) ."'";
			}

			if($queryType == 'insert') {
				$sqlQuery .= ' ('. implode(', ', $fields) .') values ('. implode(', ', $values) .')';
			} else {
				$pairs    = array_map(fn($f, $v) => "$f=$v", $fields, $values);
				$sqlQuery = str_replace('[fields]', implode(', ', $pairs), $sqlQuery);
			}
		}

		if($this->debug) {
			if($this->debug == 'log') {
				error_log(PHP_EOL . $sqlQuery . PHP_EOL);
			} else {
				echo '<p>'. PHP_EOL . $sqlQuery . PHP_EOL .'</p>';
			}
		}

		$bindParams = ($queryType == 'select' && is_array($dataFields)) ? $dataFields : [];

		$result = $this->trySQL($sqlQuery, $bindParams, $errorAlert);
		if($result === false) return false;

		if($queryType != 'select') return true;

		if(preg_match('/\blimit\s+1\s*(?:--[^\n]*|#[^\n]*|\/\*.*?\*\/)?\s*$/is', $sqlQuery)) {
			return $result->fetch_array(MYSQLI_ASSOC);
		}

		return $result->fetch_all(MYSQLI_ASSOC);
	}


	public function select($sqlQuery='', $dataFields=[], $errorAlert=true) {

		$sqlQuery = trim($sqlQuery, " \n\r\t\v\x00;");

		$result = $this->pureSQL($sqlQuery, $dataFields, $errorAlert);
		if($result === false) return false;

		if(strtolower(substr($sqlQuery, -7)) == 'limit 1') {
			return $result->fetch_array(MYSQLI_ASSOC);
		}

		return $result->fetch_all(MYSQLI_ASSOC);
	}


	public function pureSQL($sqlQuery, $dataFields=[], $errorAlert=true) {

		$sqlQuery = trim($sqlQuery, " \n\r\t\v\x00;");

		if(is_null($this->DBCon)) {
			$this->errCod = 400;
			$this->errMsg = 'Sem conexão com o banco de dados';
			$this->errCom = $sqlQuery;
			return false;
		}

		if(is_array($dataFields) && count($dataFields)) {

			if($this->debug) {
				if($this->debug == 'log') {
					error_log('Input query: '. PHP_EOL . $sqlQuery . PHP_EOL);
					error_log('Payload: '. print_r($dataFields, 1));
				} else {
					echo '<p><b>Input query:</b><br>'. PHP_EOL . $sqlQuery . PHP_EOL .'</p><b>Payload:</b><br>';
					print_r($dataFields);
				}
			}

			if(isset($dataFields['orderBy'])) {
				$sqlQuery = str_replace(':orderBy', $this->getOrderBy($dataFields['orderBy']), $sqlQuery);
				unset($dataFields['orderBy']);
			}

			if(isset($dataFields['limit'])) {
				$sqlQuery = str_replace(':limit', preg_replace('/[^0-9,\s]/', '', $dataFields['limit']), $sqlQuery);
				unset($dataFields['limit']);
			}

			foreach($dataFields as $key => $val) {
				$sqlQuery = str_replace(':'. $key, $this->real_escape_string($val), $sqlQuery);
			}
		}

		if($this->debug) {
			if($this->debug == 'log') {
				error_log('Query: '. PHP_EOL . $sqlQuery . PHP_EOL);
			} else {
				echo '<p><b>Query:</b><br>'. PHP_EOL . $sqlQuery . PHP_EOL .'</p>';
			}
		}

		$result = $this->trySQL($sqlQuery, [], $errorAlert);
		if($result === false) return false;

		return $result;
	}


	public function fetchArray($result) {
		if(!$result) return false;
		return $result->fetch_array(MYSQLI_ASSOC);
	}


	private function trySQL($sqlQuery, $bindValues=[], $errorAlert=true) {
		try {

			if($this->debug) $mtimeini = microtime(true);

			$orderedValues = [];
			$parsedQuery   = $sqlQuery;

			if(!empty($bindValues)) {
				$parsedQuery = preg_replace_callback(
					'/:([a-zA-Z0-9_]+)/',
					function($matches) use ($bindValues, &$orderedValues) {
						$orderedValues[] = $bindValues[$matches[1]] ?? '';
						return '?';
					},
					$sqlQuery
				);
			}

			// Sem :placeholders na query (mesmo com array informado), roda direto —
			// bind_param('') lançaria ValueError e chamadas antigas embutiam os valores na query.
			if(empty($orderedValues)) {
				$result = $this->DBCon->query($sqlQuery);
			}

			else {
				if($this->debug) {
					if($this->debug == 'log') error_log('Query: '. PHP_EOL . $parsedQuery . PHP_EOL);
					else echo '<p><b>Query:</b><br>'. PHP_EOL . $parsedQuery . PHP_EOL .'</p>';
				}

				$paramCount = substr_count($parsedQuery, '?');
				if($paramCount !== count($orderedValues)) {
					$this->errCod = 400;
					$this->errMsg = 'Bind mismatch: '. count($orderedValues) .' valor(es) fornecido(s), '. $paramCount .' parâmetro(s) na query. Verifique se algum :param está entre apóstrofos.';
					$this->errCom = $sqlQuery;
					if($errorAlert) $this->errorMonitor('MySQL bind mismatch: '. $this->errMsg .': ['. $sqlQuery .']');
					return false;
				}

				$stmt = $this->DBCon->prepare($parsedQuery);
				$types = str_repeat('s', count($orderedValues));
				$stmt->bind_param($types, ...$orderedValues);
				$stmt->execute();
				$result = $stmt->get_result();
			}

			if($this->debug) {
				$queryTime = round(microtime(true) - $mtimeini, 5);
				if($this->debug == 'log') error_log('Query time: '. $queryTime .'s'. PHP_EOL.PHP_EOL);
				else echo '<p><b>Query time:</b> '. $queryTime .'s.</p>';
			}

		} catch (Throwable $e) {

			$this->errCod = $e->getCode();
			$this->errMsg = $this->errCod .' - '. $e->getMessage();
			$this->errCom = $sqlQuery;

			if($errorAlert) {
				$this->errorMonitor(
					'MySQL error on '
					. $this->currentBase .'@'. $this->currentHost .': '.
					$this->errMsg . ': ['. $this->errCom .']'
				);
			}

			return false;
		}

		$this->affectedRows = $this->DBCon->affected_rows;

		return $result;
	}


	public function fetchFieldsName($result) {
		$retArr = [];

		$ret = $result->fetch_fields();

		foreach($ret as $val) {
			$retArr[] = $val->name;
		}

		return $retArr;
	}


	public function countRows($result) {
		return mysqli_num_rows($result);
	}


	public function real_escape_string($str) {
		return $this->DBCon->real_escape_string($str);
	}


	public function close() {
		if(is_object($this->DBCon)) {
			$this->DBCon->close();
		}
	}


	public function getInsertId() {
		return $this->DBCon->insert_id;
	}


	public function getCurrentUser() {
		return $this->currentUser;
	}


	public function getCurrentHost() {
		return $this->currentHost;
	}


	public function getCurrentBase() {
		return $this->currentBase;
	}


	public function getBaseNow() { //deprecated
		return $this->getCurrentBase();
	}


	public function getLimit($page, $regs) {

		$page = max(1, (int)$page);
		$regs = max(1, (int)$regs);

		return ($regs * ($page - 1)) .', '. $regs;
	}


	public function getOrderBy($orderBy, $default='codigo ASC') {

		$safe = [];

		foreach(explode(',', $orderBy) as $part) {
			$tokens = preg_split('/\s+/', trim($part));
			$col    = $tokens[0] ?? '';
			$dir    = strtoupper($tokens[1] ?? 'ASC');

			if(!preg_match('/^[a-zA-Z][a-zA-Z0-9_.]*$/', $col)) continue;
			if(!in_array($dir, ['ASC', 'DESC'])) $dir = 'ASC';

			$safe[] = "$col $dir";
		}

		return !empty($safe) ? implode(', ', $safe) : $default;
	}


	private function errorMonitor($msg, $subject='...') {
		R4::log($msg, 'DB', $this->currentBase, 'ERRO', 'sql.error.log');
	}


	public function getCurrentConfig() {
		return [
			'host'   => $this->currentHost,
			'dbname' => $this->currentBase,
			'user'   => $this->currentUser
		];
	}


	public function setDebug($bol) {
		$this->debug = $bol;
	}


	public function dieAPI($safePublicMsg) {
		if(defined('DEVMODE') && DEVMODE == true) {
			R4::dieAPI($this->errCod, $this->errMsg, $this->errCom);
		} else {
			R4::dieAPI(0, $safePublicMsg);
		}
	}
}
