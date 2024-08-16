<?php

class DB {

	private $DBCon;
	private $debug = false;
	private $currentHost = '';
	private $currentBase = '';

	public $errCod = 0;
	public $errMsg = '';
	public $errCom = '';

	public $affectedRows = 0;

	public function connect($host='', $dbname='', $user='', $pass='', $errAlert=true, $ssl=false) {

		if(empty($user) && defined('DBUSER')) $user = DBUSER;
		if(empty($pass) && defined('DBPASS')) $pass = DBPASS;
		if(empty($ssl)  && defined('DBSSL') ) $ssl  = DBSSL;

		if(!empty($host)) {
			if($this->currentHost != $host) {

				try {
					if($ssl) {
						$this->DBCon = mysqli_init();
						// $this->DBCon->options(MYSQLI_OPT_SSL_VERIFY_SERVER_CERT, false);
						// $this->DBCon->ssl_set(null, null, '/etc/my.cnf.d/certs/server-cert.pem', null, null);
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
					//$this->errCom = $e->getTrace();

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

		$sqlQuery = trim($sqlQuery, " \n\r\t\v\x00;");

		if(!empty($dataFields)) {
			if(is_array($dataFields)) {
				foreach($dataFields as $field => $value) {
					if(!empty($field)) {
						$fields[] = addslashes($field);

						if($value === 'now()')
							$values[] = $value;
						elseif(is_numeric($value))
							$values[] = "'$value'";
						elseif($value === NULL)
							$values[] = 'NULL';
						else {
							$values[] = "'". $this->real_escape_string($value) ."'";
						}
					}
				}
			}

			if(strtolower(substr($sqlQuery, 0, 6)) == 'insert') { //INSERT
				$field = implode(', ', $fields);
				$value = implode(', ', $values);
				$sqlQuery = $sqlQuery .' ('. $field .') values ('. $value .')';
			}

			elseif(strtolower(substr($sqlQuery, 0, 6)) == 'update') { //UPDATE
				foreach($fields as $key => $field) {
					$texts[] = $field .'='. $values[$key];
				}
				$text = implode(', ', $texts);
				$sqlQuery = str_replace('[fields]', $text, $sqlQuery);
			}
		}

		if($this->debug) {
			if($this->debug == 'log') {
				error_log(PHP_EOL . $sqlQuery . PHP_EOL);
			} else {
				echo '<p>'. PHP_EOL . $sqlQuery . PHP_EOL .'</p>';
			}
		}

		$result = $this->trySQL($sqlQuery, $errorAlert);
		if($result === false) return false;

		if(strtolower(substr($sqlQuery, 0, 6)) != 'select')  return true;

		else {
			$response = [];

			if(strtolower(substr($sqlQuery, -7)) == 'limit 1') {
				$response = $result->fetch_array(MYSQLI_ASSOC);
			}
			else {
				while($row = $result->fetch_array(MYSQLI_ASSOC)) $response[] = $row;
			}

			return $response;
		}
	}


	public function select($sqlQuery='', $dataFields=[], $errorAlert=true) {

		$sqlQuery = trim($sqlQuery, " \n\r\t\v\x00;");

		$result = $this->pureSQL($sqlQuery, $dataFields, $errorAlert);
		if($result === false) return false;

		$response = [];

		if(strtolower(substr($sqlQuery, -7)) == 'limit 1') {
			$response = $result->fetch_array(MYSQLI_ASSOC);
		}
		else {
			while($row = $result->fetch_array(MYSQLI_ASSOC)) $response[] = $row;
		}

		return $response;
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

			if(count($dataFields)) {
				foreach($dataFields as $key => $val) {
					$sqlQuery = str_replace(':'. $key, $this->real_escape_string($val), $sqlQuery);
				}
			}
		}

		if($this->debug) {
			if($this->debug == 'log') {
				error_log('Query: '. PHP_EOL . $sqlQuery . PHP_EOL);
			} else {
				echo '<p><b>Query:</b><br>'. PHP_EOL . $sqlQuery . PHP_EOL .'</p>';
			}
		}

		$result = $this->trySQL($sqlQuery, $errorAlert);
		if($result === false) return false;

		return $result;
	}


	public function fetchArray($result) {
		return $result->fetch_array(MYSQLI_ASSOC);
	}


	private function trySQL($sqlQuery, $errorAlert=true) {
		try {

			if($this->debug) $mtimeini = microtime(true);

			$result = $this->DBCon->query($sqlQuery);

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

		$this->affectedRows = $this->DBCon->affected_rows;

		return $result;
	}


	public function fetchFieldsName($result) {
		$retArr = array();

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


	public function getBaseNow() {
		return $this->currentBase;
	}


	public function getLimit($page, $regs) {

		$page = (int)$page;
		$regs = (int)$regs;

		if((empty($page)) or ($page < 1)) {
			$page = 1;
		}

		if((empty($regs)) or ($regs < 1)) {
			$regs = 50;
		}

		$limitpage = $page*$regs-$regs;

		return ' limit '. $limitpage .', '. $regs;
	}


	private function errorMonitor($msg, $subject='...') {
		R4::log($msg, 'DB', $this->currentBase, 'ERRO', 'sql.error.log');
	}


	public function getCurrentConfig() {
		return [
			'host'   => $this->currentHost,
			'dbname' => $this->currentBase
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