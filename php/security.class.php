<?php

class Security {

	private $passKey = '';

	public $errMsg = '';
	public $errObs = '';

	//Output Example: 00.1134.48ae.1b8f.c24
	public function generateKey($cod, $id, $passkey='') {
		$id = (int)$id;

		if(empty($passkey)) {
			$passkey = $this->passKey;
		}

		$md5 = substr(md5($cod . $id . $passkey), 5, 10);
		$md5 = substr($md5, 0, 3) .'.'. substr($md5, 3, -3) .'.'. substr($md5, -3);

		$cod = str_pad($cod, 3, '0', STR_PAD_LEFT);
		$cod = substr($cod, 0, -1) .'.'. substr($cod, -1);

		$id = str_pad($id, 3, '0', STR_PAD_LEFT);
		$id = substr($id, 0, -1) .'.'. substr($id, -1);

		return base64_encode($cod . $id . $md5);
	}


	//Output: array with cod and id
	public function extractKey($key64, $passkey='') {
		if(empty($key64)) {
			$this->errMsg = 'Empty key';
			return false;
		}

		if(empty($passkey)) {
			$passkey = $this->passKey;
		}

		$key = base64_decode($key64);

		$cut = strpos($key, '.')+2;
		$resp['cod'] = str_replace('.', '', substr($key, 0, $cut))*1;
		$key = substr($key, $cut);

		$cut = strpos($key, '.')+2;
		$resp['id'] = str_replace('.', '', substr($key, 0, $cut))*1;
		$key = str_replace('.', '', substr($key, $cut));

		$md5 = substr(md5($resp['cod'] . $resp['id'] . $passkey), 5, 10);

		if($md5 != $key) {
			$this->errMsg = 'Invalid key';
			return false;
		}

		return $resp;
	}


}