<?php
class Logger {

	private $ready = false;
	private $errMsg = '';

	public $dirPath = '';
	public $logFile = 'reg.log';
	public $type = 'INFO'; //INFO, WARN, ERRO, etc
	public $module = '';
	public $idModule = '';
	public $msg = '';


	public function __construct() {
		$this->dirPath = '/var/log/r4/'. SESSIONKEY .'/';
	}


	public function log($msg='', $module=null, $idModule=null, $type=null) {

		if(!$this->ready) {
			$ret = $this->logStart();
			if($ret === false) return false;
		}

		if($type === null) $type = $this->type;
		if($module === null) $module = $this->module;
		if($idModule === null) $idModule = $this->idModule;

		$txt = (is_array($msg)) ? json_encode($msg) : $msg;

		foreach([$module, $idModule, $type, $txt] as $item) {
			$arrItem[] = $this->formatItem($item);
		}

		$this->output(implode('|', $arrItem));
	}


	public function logStart() {

		if(!defined('SESSIONKEY') || !SESSIONKEY) {
			$this->errMsg = 'Erro ao iniciar o Logger. Defina o SESSIONKEY no config.inc.php';
		}
		else {

			if(!is_dir($this->dirPath)) {
				$ret = $this->createPath($this->dirPath);

				if($ret === false) {
					$this->errMsg = 'Erro ao iniciar o Logger. Não possível acessar'
					              . ' o diretório de logs ('. $this->dirPath .').';
				}
			}
		}

		if($this->errMsg) {
			$this->ready = false;
			error_log($this->errMsg);
			return false;
		}

		$this->ready = true;
		return true;
	}


	private function createPath($dirPath) {
		$dir = '';
		$arr = explode('/', rtrim($dirPath, '/'));
		foreach($arr as $step) {
			$dir .= $step .'/';
			if(is_dir($dir)) continue;
			else {
				if(!mkdir($dir)) {
					$this->errMsg = 'Erro ao criar a pasta de destino ('. $dir .')';
					return false;
				}
			}
		}

		return is_dir($dirPath);
	}


	private function formatItem($txt) {
		$txt = str_replace("\t", '\t', $txt);
		$txt = str_replace("\n", '\n', $txt);
		$txt = str_replace('|', '\|', $txt);
		return $txt;
	}


	private function output($txt) {
		if(!$this->ready) {
			error_log('R4::Logger: '. $txt);
		} else {

			//Tenta gravar por 5 vezes com sleep aleatório
			//de milisegundos entre 0 e 2 segundos
			for($ii=0; $ii<5; $ii++) {
				$ret = file_put_contents(
					$this->dirPath . $this->logFile,
					date('Y-m-d H:i:s|') . $txt . PHP_EOL,
					FILE_APPEND | LOCK_EX
				);
				if($ret !== false) return true;
				usleep(rand(0, 2000000));
			}

			return false;
		}
	}
}
