<?php

class DB {

	private $DBCon   = '';
	private $debug   = false;
	private $currentHost = '';
	private $currentBase = '';

	public $errCod = 0;
	public $errMsg = '';
	public $errCom = '';

	public function connect($host='', $dbname='', $user='', $pass='', $errAlert=true) {

		if(!$user) $user = DBUSER;
		if(!$pass) $pass = DBPASS;

		if(!empty($host)) {
			if($this->currentHost != $host) {

				try {

					$this->DBCon = new mysqli($host, $user, $pass);

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


	public function sql($com, $dataFields='', $stripTags=true, $errorAlert=true) {

		$com = trim($com);

		//If $dataFields is empty, just run the $com command
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
							if($stripTags) $value = strip_tags($value);
							$value = iconv('UTF-8', 'UTF-8//IGNORE', $value);
							$value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $value);
							$value = str_replace('\0', '/0', $value);
							$value = addslashes($value);
							$values[] = "'$value'";
						}
					}
				}
			}

			if(strtolower(substr($com, 0, 6)) == 'insert') { //INSERT
				$field = implode(', ', $fields);
				$value = implode(', ', $values);
				$com = $com .' ('. $field .') values ('. $value .')';
			}

			elseif(strtolower(substr($com, 0, 6)) == 'update') { //UPDATE
				foreach($fields as $key => $field) {
					$texts[] = $field .'='. $values[$key];
				}
				$text = implode(', ', $texts);
				$com = str_replace('[fields]', $text, $com);
			}
		}

		if($this->debug) {
			echo '<p>'. PHP_EOL . $com . PHP_EOL .'</p>';
		}

		//Do the sql command
		try {

			$result = $this->DBCon->query($com);

		} catch (Exception $e) {

			$this->errCod = $e->getCode();
			$this->errMsg = $this->errCod .' - '. $e->getMessage();
			$this->errCom = $com;

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

		//If it is a select command, return an array;
		if(strtolower(substr($com, 0, 6)) != 'select') {
			return true;
		}
		else {
			if(strtolower(substr($com, -7)) == 'limit 1') { //If is 'limit 1' set, return the value directly
				$response = $result->fetch_array(MYSQLI_ASSOC);
			}
			else { //Else, return into a list
				$response = array();

				while($row = $result->fetch_array(MYSQLI_ASSOC))  {
					$response[] = $row;
				}
			}

			return $response;
		}
	}


	public function pureSQL($com, $errorAlert=true) {

		if($this->debug) {
			echo '<p>'. PHP_EOL . $com . PHP_EOL .'</p>';
		}

		try {

			$result = $this->DBCon->query($com);

		} catch (Exception $e) {

			$this->errCod = $e->getCode();
			$this->errMsg = $this->errCod .' - '. $e->getMessage();
			$this->errCom = $com;

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
		if(is_resource($this->DBCon)) {
			mysqli_close($this->DBCon);
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
		error_log(PHP_EOL. '******* DB ERROR *******' .PHP_EOL.$msg);
	}


	public function getCurrentConfig() {
		return [
			'host'   => $this->currentHost,
			'dbname' => $this->currentBase
		];
	}


	public function setDebug($bol) {
		$this->debug = (($bol) ? true : false);
	}


	public function dieAPI($safePublicMsg) {
		if(defined('DEVMODE') && DEVMODE == true) {
			R4::dieAPI($this->errCod, $this->errMsg, $this->errCom);
		} else {
			R4::dieAPI(0, $safePublicMsg);
		}
	}
}