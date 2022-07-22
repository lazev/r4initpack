<?php

class Logger {

	private $dirPath = '/var/log/r4/';
	private $ready = true;
	private $errMsg = '';

	public $logFile = SYSTEMID .'.log';
	public $type = 'INFO'; //INFO, WARN, ERRO
	public $module = '';
	public $idModule = '';
	public $msg = '';

	public function __construct() {

		if(!defined('SYSTEMID') || !SYSTEMID) {
			$this->errMsg = 'Erro ao iniciar o R4::Logger. Defina o SYSTEMID no config.inc.php';
		}
		else {

			if(!is_dir($this->dirPath)) {
				mkdir($this->dirPath);

				if(!is_dir($this->dirPath)) {
					$this->errMsg = 'Erro ao iniciar o R4::Logger. Não possível acessar'
					              . ' o diretório de logs ('. $this->dirPath .').';
				}
			}

			if(!file_exists($this->dirPath . $this->logFile)) {
				$ret = $this->output('|||VVV Inicio do log VVV');

				if($ret === false) {
					$this->errMsg = 'Erro no R4::Logger. Não foi possível gravar no arquivo';
				}
			}
		}

		if($this->errMsg) {
			$this->ready = false;
			error_log($this->errMsg);
		}
	}


	public function log($msg='', $module=null, $idModule=null, $type=null) {

		if($type === null) $type = $this->type;
		if($module === null) $module = $this->module;
		if($idModule === null) $idModule = $this->idModule;

		foreach([$module, $idModule, $type, $msg] as $item) {
			$arrItem[] = $this->formatItem($item);
		}

		$this->output(implode('|', $arrItem));
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
			return file_put_contents($this->dirPath . $this->logFile, date('Y-m-d H:i:s|') . $txt . PHP_EOL, FILE_APPEND);
		}
	}
}