<?php
class R4 {

	public static function getRequest($cont='') {

		if($cont==='') $cont = $_REQUEST;

		if(!is_array($cont)) return [];

		return $cont;
	}


	public static function retOkAPI($params=[]) {

		$params = R4::recursiveTagSymbolsReplace($params);

		$params = R4::recursiveNumericCast($params);

		$params['ok'] = 1;

		echo json_encode($params);
	}


	public static function dieAPI($stat=0, $msg='', $obs='', $fields=[]) {
		$jsonfields = (count($fields)) ? $jsonfields = ', "errFields":'. json_encode($fields) : '';
		echo '{"error": 1, "status": "'. $stat .'", "errMsg": "'. $msg .'", "errObs": "'. $obs .'"'. $jsonfields .'}';
		require 'r4iniend.php';
		die();
	}


	public static function log($msg, $module=null, $idModule=null, $type=null, $logFile='') {
		require_once dirname(__FILE__) . '/logger.class.php';

		$log = new Logger;

		if(!empty($logFile)) $log->logFile = $logFile;

		$log->log($msg, $module, $idModule, $type);
	}


	public static function setSession($index, $val) {
		$_SESSION[SYSTEMID][$index] = $val;
		return true;
	}


	public static function getSession($index) {
		if(defined('APION') && APION) {
			global $_CONFIG;
			if(!isset($_CONFIG['R4SID'][$index])) return null;
			return $_CONFIG['R4SID'][$index];
		}

		if(!isset($_SESSION[SYSTEMID][$index])) return null;
		return $_SESSION[SYSTEMID][$index];
	}


	public static function clearSession() {
		$_SESSION[SYSTEMID] = [];
		return true;
	}


	public static function intArray($val) {
		if(is_array($val)) {
			$arr = $val;
		} else {
			$arr = (strpos($val, ',') !== false) ? explode(',', $val) : [$val];
		}

		foreach($arr as $item) $ret[] = (int)$item;

		return $ret;
	}


	public static function mergeNewArr($old, $new) {
		$ret = [
			'changed' => [],
			'merged'  => [],
			'oldVal'  => []
		];

		foreach($new as $key => $val) {
			$up = false;
			//Apenas se tem no BD
			if(isset($old[$key])) {
				//Apenas se o novo valor é diferente do valor do BD
				if($old[$key] != $val) {
					//Se o valor novo é em branco, mas no BD
					//os valores em branco são diferentes
					if(
							(empty($val))
						|| ($val == '0000-00-00')
						|| ($val == '0000-00-00 00:00:00')
					){
						if(!empty($old[$key])) {
							if(
								($old[$key] != '0000-00-00')
							&& ($old[$key] != '0000-00-00 00:00:00')
							&& ($old[$key] !== 0)
							){
								$up = true;
							}
						}
					}
					elseif(R4::checkDate($val)) {
						if($val .' 00:00:00' != $old[$key]) {
							$up = true;
						}
					}
					else {
						$up = true;
					}
				}
			}
			if($up) {
				$ret['oldVal'][$key] = $old[$key];
				$ret['changed'][$key] = $val;
				$old[$key] = $val;
			}
		}
		$ret['merged'] = $old;
		return $ret;
	}


	public static function zeroFill($value, $totalsize=3) {
		while(strlen($value) < $totalsize) $value = '0' . $value;
		return $value;
	}


	public static function onlyNumbers($string) {
		$result = preg_replace('/[^0-9]/', '', $string);
		return $result;
	}


	public static function friendChars($string, $allowStr='') {
		return preg_replace('/[^A-Z0-9-_'. $allowStr .']/i', '', $string);
	}


	public static function ucase($subject) {
		return is_array($subject)
			? array_map('R4::ucase', $subject)
			: mb_strtoupper($subject);
	}


	public static function changeDate($date, $year=0, $month=0, $day=0, $hour=0, $min=0, $sec=0) {
		if(strlen($date) > 12) { //Date time (Y-m-d H:i:s)
			$temp = explode(' ', $date);
			$dat = explode('-', $temp[0]);
			$tim = explode(':', $temp[1]);
			return date('Y-m-d H:i:s', mktime($tim[0]+$hour, $tim[1]+$min, $tim[2]+$sec, $dat[1]+$month, $dat[2]+$day, $dat[0]+$year));
		} else {
			$split = explode('-', $date);
			return date('Y-m-d', mktime(0, 0, 0, (int)$split[1]+$month, (int)$split[2]+$day, (int)$split[0]+$year));
		}
	}


	public static function checkDate($date) {
		if(strlen($date) > 12) { //Datetime
			if(preg_match('/^(\d{4})-(\d{2})-(\d{2}) ([01][0-9]|2[0-3]):([0-5][0-9]):([0-5][0-9])$/', $date, $matches)) {
				if(checkdate($matches[2], $matches[3], $matches[1])) return true;
			}
		} else { //Only date
			if(preg_match('/^(\d{4})-(\d{2})-(\d{2})$/', $date, $matches)) {
				if(checkdate($matches[2], $matches[3], $matches[1])) return true;
			}
		}

		return false;
	}


	public static function checkMail($email) {
		return preg_match('|^[_a-z0-9-]+(\.[_a-z0-9-]+)*@[a-z0-9-]+(\.[a-z0-9-]+)*(\.[a-z]+)$|i', $email);
	}


	public static function CPForCNPJ($x) {
		if(strlen(R4::onlyNumbers($x)) == 11)     return 'CPF';
		elseif(strlen(R4::onlyNumbers($x)) == 14) return 'CNPJ';
		elseif(strlen(R4::onlyNumbers($x)) == 15) return 'CNPJ';
		return false;
	}


	public static function checkCPFCNPJ($cpfcnpj) {
		$cpfcnpj = R4::onlyNumbers($cpfcnpj);
		if(strlen($cpfcnpj) <= 12) return R4::checkCPF($cpfcnpj);
		else return R4::checkCNPJ($cpfcnpj);
	}


	public static function checkCPF($cpf) {
		$cpf = R4::onlyNumbers($cpf);

		// Verifica se nenhuma das sequências abaixo foi digitada, caso seja, retorna falso
		if(strlen($cpf) != 11 || $cpf == '00000000000' || $cpf == '11111111111' ||
		$cpf == '22222222222' || $cpf == '33333333333' || $cpf == '44444444444' ||
		$cpf == '55555555555' || $cpf == '66666666666' || $cpf == '77777777777' ||
		$cpf == '88888888888' || $cpf == '99999999999') {
			return false;
		} else {
			for($t = 9; $t < 11; $t++) {
				for($d = 0, $c = 0; $c < $t; $c++) $d += $cpf[$c] * (($t + 1) - $c);
				$d = ((10 * $d) % 11) % 10;
				if($cpf[$c] != $d) return false;
			}
			return true;
		}
	}


	public static function checkCNPJ($cnpj) {
		$cnpj = R4::onlyNumbers($cnpj);
		if(strlen($cnpj) == 15) $cnpj = substr($cnpj, 1);
		if(strlen($cnpj) <> 14) return false;
		$soma = 0;
		$soma += ($cnpj[0]*5)+($cnpj[1]*4)+($cnpj[2]*3)+($cnpj[3]*2)+($cnpj[4]*9)+($cnpj[5]*8);
		$soma += ($cnpj[6]*7)+($cnpj[7]*6)+($cnpj[8]*5)+($cnpj[9]*4)+($cnpj[10]*3)+($cnpj[11]*2);
		$d1 = $soma % 11;
		$d1 = $d1 < 2 ? 0 : 11 - $d1;
		$soma = 0;
		$soma += ($cnpj[0]*6)+($cnpj[1]*5)+($cnpj[2]*4)+($cnpj[3]*3)+($cnpj[4]*2)+($cnpj[5]*9)+($cnpj[6]*8);
		$soma += ($cnpj[7]*7)+($cnpj[8]*6)+($cnpj[9]*5)+($cnpj[10]*4)+($cnpj[11]*3)+($cnpj[12]*2);
		$d2 = $soma % 11;
		$d2 = $d2 < 2 ? 0 : 11 - $d2;
		if($cnpj[12] == $d1 && $cnpj[13] == $d2) return true;
		else return false;
	}


	public static function numberMask($value, $mindec=2, $maxdec=0, $ifzero=null) {
		$mindec = (int)$mindec;
		if(($ifzero!==null) && ((float)$value==0)) return $ifzero;
		else {
			$value = (float)$value;
			if(is_numeric($value)) {
				if($maxdec > $mindec) {
					$value = number_format($value, $maxdec, ',', '.');
					$ct = $mindec+1+strpos($value, ',');
					while(strlen($value) > $ct) {
						if(substr($value, -1) == 0) {
							$value = substr($value, 0, -1);
						}
						else break;
					}
					return trim($value, ',');

				} else {
					return number_format($value, $mindec, ',', '.');
				}
			}
			else return $value;
		}
	}


	public static function numberUnmask($number) {
		$resp = str_replace('.', '', $number);
		$resp = trim(str_replace(',', '.', $resp));
		if(is_numeric($resp)) return $resp;
		else return $number;
	}


	public static function dateMask($date='') {
		if(($date == '')
		|| ($date == '0000-00-00')
		|| ($date == '0000-00-00 00:00:00')) {
			return '';
		}
		else {
			//If it's datetime format
			$hour = '';
			if(strlen($date) > 12) {
				$prima = explode(' ', $date);
				$hour = ' '. $prima[1];
				$date = $prima[0];
			}
			$split = explode('-', $date);
			return $split[2].'/'.$split[1].'/'.$split[0] . $hour;
		}
	}


	public static function dateUnmask($date='') {
		if($date == '') return '';
		else {
			if(strlen($date) > 12) {
				$prima = explode(' ', $date);
				$hour = ' '. $prima[1];
				$date = $prima[0];
			}
			$split = explode('/',$date);
			if(strlen($split[2]) == 2) {
				if($split[2] < 35) $split[2] = '20'. $split[2];
				else $split[2] = '19'.$split[2];
			}
			return $split[2].'-'. str_pad($split[1], 2, '0', STR_PAD_LEFT)
			     . '-'. str_pad($split[0], 2, '0', STR_PAD_LEFT) . $hour;
		}
	}


	public static function cepMask($cep) {
		$cep = R4::onlyNumbers($cep);

		return substr($cep, 0, 5) .'-'. substr($cep, 5);
	}


	public static function cpfCnpjMask($x) {
		$x = R4::onlyNumbers($x);
		if(strlen($x) == 0) return '';
		if(strlen($x) > 12) {
			if(strlen($x) == 14) {
				return substr($x, 0, 2) .'.'. substr($x, 2, 3) .'.'. substr($x, 5, 3) .'/'. substr($x, 8, 4) .'-'. substr($x, 12);
			} else {
				return substr($x, 0, 3) .'.'. substr($x, 3, 3) .'.'. substr($x, 6, 3) .'/'. substr($x, 9, 4) .'-'. substr($x, 13);
			}
		}
		else return substr($x, 0, 3) .'.'. substr($x, 3, 3) .'.'. substr($x, 6, 3) .'-'. substr($x, 9);
	}


	public static function fileSizeMask($size) {
		$i=0;
		$iec = array('B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB');
		while(($size/1024) > 1) {
			$size=$size/1024;
			$i++;
		}
		return R4::numberMask(substr($size, 0, strpos($size,'.')+4)).$iec[$i];
	}


	public static function friendfyName($name) {
		$allowed = 'abcdefghijklmnopqrstuvwxyz0123456789-._';

		$x = trim($name);

		$x = stripslashes($x);

		$charout = array('\'', "\\", '"', ' ', '--', '-.', '.-',
		                 '-.-', '.-.', '..', '$quot;', '&');

		$charin  = array('',   '',   '',  '_', '-',  '.',  '.',
		                 '.',   '.',   '.',  '',       '_e_');

		$x = str_replace($charout, $charin, $x);
		$x = strtolower($x);
		$x = R4::stripAccent($x);

		$resp = '';
		for($ii=0; $ii<strlen($x); $ii++) {
			if(stripos($allowed, $x[$ii]) !== false) {
				$resp .= $x[$ii];
			}
		}
		while(strrpos($resp, '.') == (strlen($resp)-1)) {
			$resp = substr($resp, 0, (strlen($resp)-1));
		}
		while(strpos($resp, '.')     === 0) $resp = substr($resp, 1);
		while(strpos($resp, 'www.')  === 0) $resp = substr($resp, 4);
		while(strpos($resp, 'wwww.') === 0) $resp = substr($resp, 5);
		if(empty($resp)) $resp = 'general';
		return $resp;
	}


	public static function stripAccent($string) {
		return str_replace(
			array('à','á','â','ã','ä','ç','è','é','ê','ë','ì','í','î','ï','ñ',
			      'ò','ó','ô','õ','ö','ù','ú','û','ü','ý','ÿ','À','Á','Â','Ã','Ä',
			      'Ç','È','É','Ê','Ë','Ì','Í','Î','Ï','Ñ','Ò','Ó','Ô','Õ','Ö',
			      'Ù','Ú','Û','Ü','Ý'),
			array('a','a','a','a','a','c','e','e','e','e','i','i','i','i', 'n',
			      'o','o','o','o','o','u','u','u','u','y','y','A','A','A','A','A',
			      'C','E','E','E','E','I','I','I','I','N','O','O','O','O','O',
			      'U','U','U','U','Y'),
			$string);
	}


	public static function recursiveNumericCast($subject) {
		// $regex = '/^(?!0[1-9])-?(0|[1-9]\d*)(\.\d+)?$/';
		return is_array($subject)
			? array_map('R4::recursiveNumericCast', $subject)
			// : ((is_string($subject) && is_numeric($subject) && preg_match($regex, $subject) && $subject <= 2147483647) ? $subject*1 : $subject);
			: ((is_numeric($subject) && ($subject[0] != 0 || mb_strlen($subject) == 1) && $subject <= 2147483647) ? $subject*1 : $subject);
	}


	public static function recursiveTagSymbolsReplace($subject) {
		return is_array($subject)
			? array_map('R4::recursiveTagSymbolsReplace', $subject)
			: str_replace(['<', '>'], ['&lt;', '&gt;'], $subject);
	}


	public static function recursiveStripSlashes($subject) {
		return is_array($subject)
			? array_map('R4::recursiveStripSlashes', $subject)
			: stripslashes($subject);
	}


	public static function recursiveStrEscape($subject) {
		return is_array($subject)
			? array_map('R4::recursiveStrEscape', $subject)
			: mb_ereg_replace('[\x00\x0A\x0D\x1A\x22\x27\x5C]', '\\\0', $subject);
	}
}