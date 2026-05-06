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

		if(empty($user) && defined('DBUSER')) $user = DBUSER;
		if(empty($pass) && defined('DBPASS')) $pass = DBPASS;
		if(empty($ssl)  && defined('DBSSL') ) $ssl  = DBSSL;

		if(!empty($host)) {
			if($this->currentHost != $host || $this->currentUser != $user) {

				try {
					$dsn = "mysql:host=$host;charset=utf8mb4";

					$options = [
						PDO::ATTR_ERRMODE            => PDO::ERRMODE_EXCEPTION,
						PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
					];

					if($ssl) {
						// $options[PDO::MYSQL_ATTR_SSL_CA] = '/etc/my.cnf.d/certs/server-cert.pem';
						$options[PDO::MYSQL_ATTR_SSL_VERIFY_SERVER_CERT] = false;
					}

					$this->DBCon = new PDO($dsn, $user, $pass, $options);
					$this->DBCon->exec("SET time_zone='". date('P') ."'");

				} catch (Exception $e) {

					$this->errCod = $e->getCode();
					$this->errMsg = $this->errCod .' - '. $e->getMessage();

					if($errAlert) $this->errorMonitor('Server '. $host .' connection error: '. $this->errMsg);

					return false;
				}

				$this->currentHost = $host;
				$this->currentUser = $user;
				$this->currentBase = '';
			}
		}

		if(!empty($dbname)) {
			if($this->currentBase != $dbname) {

				try {
					$this->DBCon->exec("USE `$dbname`");
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

		$sqlQuery   = trim($sqlQuery, " \n\r\t\v\x00;");
		$bindValues = [];

		if(!empty($dataFields) && is_array($dataFields)) {

			$fieldNames = [];
			$fieldVals  = [];

			foreach($dataFields as $field => $value) {
				if(empty($field)) continue;
				$fieldNames[] = $field;
				$fieldVals[]  = $value;
			}

			$queryType = strtolower(substr($sqlQuery, 0, 6));

			if($queryType == 'insert') {

				$cols  = [];
				$marks = [];

				foreach($fieldNames as $i => $field) {
					$cols[] = $field;
					if($fieldVals[$i] === 'now()') {
						$marks[] = 'now()';
					} else {
						$marks[]      = '?';
						$bindValues[] = $fieldVals[$i];
					}
				}

				$sqlQuery .= ' ('. implode(', ', $cols) .') values ('. implode(', ', $marks) .')';

			} elseif($queryType == 'update') {

				$setParts = [];

				foreach($fieldNames as $i => $field) {
					if($fieldVals[$i] === 'now()') {
						$setParts[] = "$field=now()";
					} else {
						$setParts[]   = "$field=?";
						$bindValues[] = $fieldVals[$i];
					}
				}

				$sqlQuery = str_replace('[fields]', implode(', ', $setParts), $sqlQuery);
			}
		}

		if($this->debug) {
			if($this->debug == 'log') {
				error_log(PHP_EOL . $sqlQuery . PHP_EOL);
				if(!empty($bindValues)) error_log('Bind: '. print_r($bindValues, 1));
			} else {
				echo '<p>'. PHP_EOL . $sqlQuery . PHP_EOL .'</p>';
				if(!empty($bindValues)) { echo '<b>Bind:</b><br>'; print_r($bindValues); }
			}
		}

		$result = $this->trySQL($sqlQuery, $bindValues, $errorAlert);
		if($result === false) return false;

		if(strtolower(substr($sqlQuery, 0, 6)) != 'select') return true;

		if(strtolower(substr($sqlQuery, -7)) == 'limit 1') {
			return $result->fetch(PDO::FETCH_ASSOC);
		}

		return $result->fetchAll(PDO::FETCH_ASSOC);
	}


	public function select($sqlQuery='', $dataFields=[], $errorAlert=true) {

		$sqlQuery = trim($sqlQuery, " \n\r\t\v\x00;");

		$result = $this->pureSQL($sqlQuery, $dataFields, $errorAlert);
		if($result === false) return false;

		if(strtolower(substr($sqlQuery, -7)) == 'limit 1') {
			return $result->fetch(PDO::FETCH_ASSOC);
		}

		return $result->fetchAll(PDO::FETCH_ASSOC);
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


	public function safeBind($sqlQuery, $dataFields=[], $errorAlert=true) {

		$sqlQuery = trim($sqlQuery, " \n\r\t\v\x00;");

		if(is_null($this->DBCon)) {
			$this->errCod = 400;
			$this->errMsg = 'Sem conexão com o banco de dados';
			$this->errCom = $sqlQuery;
			return false;
		}

		if($this->debug) {
			if($this->debug == 'log') {
				error_log('Input query: '. PHP_EOL . $sqlQuery . PHP_EOL);
				if(!empty($dataFields)) error_log('Payload: '. print_r($dataFields, 1));
			} else {
				echo '<p><b>Input query:</b><br>'. PHP_EOL . $sqlQuery . PHP_EOL .'</p>';
				if(!empty($dataFields)) { echo '<b>Payload:</b><br>'; print_r($dataFields); }
			}
		}

		$result = $this->trySQL($sqlQuery, $dataFields, $errorAlert);
		if($result === false) return false;

		if(strtolower(substr($sqlQuery, 0, 6)) != 'select') return true;

		if(strtolower(substr($sqlQuery, -7)) == 'limit 1') {
			return $result->fetch(PDO::FETCH_ASSOC);
		}

		return $result->fetchAll(PDO::FETCH_ASSOC);
	}


	public function fetchArray($result) {
		if(!$result) return false;
		return $result->fetch(PDO::FETCH_ASSOC);
	}


	private function trySQL($sqlQuery, $bindValues=[], $errorAlert=true) {
		try {

			if($this->debug) $mtimeini = microtime(true);

			if(!empty($bindValues)) {
				$stmt = $this->DBCon->prepare($sqlQuery);
				$stmt->execute($bindValues);
				$result = $stmt;
			} else {
				$result = $this->DBCon->query($sqlQuery);
			}

			if($this->debug) {
				$queryTime = round(microtime(true) - $mtimeini, 5);
				if($this->debug == 'log') error_log('Query time: '. $queryTime .'s'. PHP_EOL.PHP_EOL);
				else echo '<p><b>Query time:</b> '. $queryTime .'s.</p>';
			}

		} catch (Exception $e) {

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

		$this->affectedRows = $result->rowCount();

		return $result;
	}


	public function fetchFieldsName($result) {
		$retArr   = [];
		$colCount = $result->columnCount();

		for($i = 0; $i < $colCount; $i++) {
			$meta     = $result->getColumnMeta($i);
			$retArr[] = $meta['name'];
		}

		return $retArr;
	}


	public function countRows($result) {
		return $result->rowCount();
	}


	public function real_escape_string($str) {
		$quoted = $this->DBCon->quote($str);
		return substr($quoted, 1, -1);
	}


	public function close() {
		$this->DBCon = null;
	}


	public function getInsertId() {
		return $this->DBCon->lastInsertId();
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


	public function getOrderBy($orderBy, $default='id ASC') {

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
