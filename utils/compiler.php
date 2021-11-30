#!/usr/bin/php
<?php

$cfgfile = '.compiler.json';
$r4path = dirname(__FILE__) .'/../';

if(!file_exists($cfgfile)) {
	escreve('Arquivo de configuração não encontrado');
	die();
}

$cfgstr = trim(file_get_contents($cfgfile));

if(empty($cfgstr)) {
	escreve('Arquivo de configuração em branco');
	die();
}

$cfg = json_decode($cfgstr, 1);

$jsPacker       = $cfg['jsPacker'] ?? '';
$monitorFolders = $cfg['foldersToMonitor'];

$past = '';
if((count($argv) > 1 && $argv[1] == 'monitor') || (isset($monitor) && $monitor)) {

	escreve('Monitoring...');

	while(true) {
		$ls = getlshash();
		if($past != $ls) {
			compile();
			escreve('Monitoring...');
			$past = getlshash();
		} else {
			$past = $ls;
		}
		sleep(2);
	}

} else {
	escreve('Single project update...');
	compile();
}


function getlshash() {
	global $monitorFolders;

	foreach($monitorFolders as $folder) {
		$lsarr[] = trim(shell_exec('ls -Rtral '. $folder .' | md5sum'));
	}

	return implode('', $lsarr);
}


function compile() {
	global $r4path, $jsPacker;

	escreve('Updating codes...');

	if(strtoupper(substr(PHP_OS, 0, 3)) === 'WIN') {
		//COMANDOS PARA WINDOWS
	} else {
		shell_exec('rm -rf ./public/*');
		shell_exec('mkdir ./public/_assets');
		shell_exec('mkdir ./public/_assets/r4');
		shell_exec('mkdir ./public/_assets/vendor');
		shell_exec('cp -r ./src/* ./public/');
		shell_exec('cp -r '. $r4path .'/php ./public/_assets/r4/');
		shell_exec('cp -r ./vendor/vendor/* ./public/_assets/vendor/');
	}

	shell_exec('php '. $r4path .'/utils/templater.php');
	shell_exec('php '. $r4path .'/utils/packer.php '. $jsPacker);

	escreve('Ok'. PHP_EOL);
}

function escreve($msg) {
	echo PHP_EOL . date('H:i:s ') . $msg;
}