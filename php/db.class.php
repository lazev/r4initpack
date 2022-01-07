<?php

class DB {

	private $DBCon   = '';
	private $hostNow = '';
	private $baseNow = '';
	private $debug   = false;

	public $errCod = 0;
	public $errMsg = '';
	public $errCom = '';

	public function connect($host='', $dbname='', $user='', $pass='', $errAlert=true) {

		if(!$user) $user = DBUSER;
		if(!$pass) $pass = DBPASS;

		if(!empty($host)) {
			if($this->hostNow != $host) {
				$this->DBCon = new mysqli($host, $user, $pass);

				if($this->DBCon->connect_errno) {
					if($errorAlert) {
						$this->errorMonitor(
							'Server '. $host .' connection error: '
							. $this->DBCon->connect_errno . ' - '
							. $this->DBCon->connect_error
						);
					}
					$this->errCod = $this->DBCon->connect_errno;
					$this->errMsg = $this->DBCon->connect_error;
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
				$this->hostNow = $host;
				$this->baseNow = '';
			}
		}

		if(!empty($dbname)) {
			if($this->baseNow != $dbname) {
				if(!$this->DBCon->select_db($dbname)) {
					if($errAlert) {
						$this->errorMonitor(
							'Database '. $dbname .' selection error on '
							. $this->hostNow .': '
							. $this->DBCon->errno .' - '
							. $this->DBCon->error
						);
					}
					$this->errCod = $this->DBCon->errno;
					$this->errMsg = $this->DBCon->error;
					return false;
				}
				$this->baseNow = $dbname;
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

						if((is_numeric($value)) || ($value === 'now()'))
							$values[] = $value;
						elseif($value === NULL)
							$values[] = 'NULL';
						else {
							if($stripTags) $value = strip_tags($value);
							$value = iconv('UTF-8', 'UTF-8//IGNORE', $value);
							$value = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', '', $value);
							$value = str_replace('\0', '/0', $value);
							$value = addslashes($value);
							$values[] = "'". $value ."'";
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
			if($errorAlert) {
				$this->errorMonitor(
					'MySQL error on '
					. $this->baseNow .'@'
					. $this->hostNow .': '
					. $this->DBCon->errno .' - '
					. $this->DBCon->error .'. '
					. 'Command: '. $com
				);
			}
			$this->errCod = $this->DBCon->errno;
			$this->errMsg = $this->DBCon->error;
			$this->errCom = $com;
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
		if(!$result = $this->DBCon->query($com)) {
			if($errorAlert) {
				$this->errorMonitor(
					'MySQL error on '
					. $this->baseNow .'@'
					. $this->hostNow .': '
					. $this->DBCon->errno .' - '
					. $this->DBCon->error .'. '
					. 'Command: '. $com
				);
			}
			$this->errCod = $this->DBCon->errno;
			$this->errMsg = $this->DBCon->error;
			$this->errCom = $com;
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
		return $this->baseNow;
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
		if(defined(DEVMODE) && DEVMODE == true) {
			echo PHP_EOL. $msg .PHP_EOL;
		}
		error_log('************');
		error_log(PHP_EOL. $msg .PHP_EOL);
	}


	public function getCurrentConfig() {
		return [
			'host'   => $this->hostNow,
			'dbname' => $this->baseNow
		];
	}


	public function setDebug($bol) {
		$this->debug = (($bol) ? true : false);
	}
}