#!/usr/bin/php
<?php

$cfgfile = '.compiler.json';

$sep    = DIRECTORY_SEPARATOR;
$r4path = dirname(__FILE__) . $sep .'..'. $sep;

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

print_r($cfg);

$jsPacker       = $cfg['jsPacker'] ?? '';
$monitorFolders = $cfg['foldersToMonitor'];

escreve('Running on ' . PHP_OS_FAMILY);

$past = '';
if((count($argv) > 1 && $argv[1] == 'monitor') || (isset($monitor) && $monitor)) {

	escreve('Monitoring...');

	while(true) {
		$ls = getlshash();
		if($past != $ls) {
			escreve('Changes detected...');
			sleep(0.5);
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

	if(PHP_OS_FAMILY == 'Windows') {
		foreach($monitorFolders as $folder) {
			$folder = str_replace('/', '\\', $folder);
			$contDIR = trim(shell_exec('forfiles /P "'. $folder . '" /S /M * /C "cmd /c echo @fdate @ftime @file"'));
			// https://docs.microsoft.com/pt-br/windows-server/administration/windows-commands/forfiles
			$lsarr[] = md5($contDIR);
		}

	} else {
		foreach($monitorFolders as $folder) {
			$lsarr[] = trim(shell_exec('ls -Rtral '. $folder .' | md5sum'));
		}
	}

	return implode('', $lsarr);
}


function compile() {
	global $sep, $r4path, $jsPacker;

	escreve('Updating codes...');

	if(PHP_OS_FAMILY == 'Windows') {
		shell_exec('rmdir /s /q ".\public"');
		shell_exec('mkdir "./public"');
		echo shell_exec('Xcopy  /r /s /e /c /q /y "./src" "./public"');
		shell_exec('mkdir "./public/_assets/r4/php"');
		shell_exec('mkdir "./public/_assets/vendor"');
		shell_exec('Xcopy  /r /s /e /c /q /y  "'. $r4path .'vendor\r4\php" "./public/_assets/r4/php"');
		shell_exec('Xcopy /r /s /e /c /q /y "./vendor/vendor" "./public/_assets/vendor"');
	} else {
		shell_exec('rm -rf ./public/*');
		shell_exec('mkdir ./public/_assets');
		shell_exec('mkdir ./public/_assets/r4');
		shell_exec('mkdir ./public/_assets/vendor');
		shell_exec('cp -r ./src/* ./public/');
		shell_exec('cp -r '. $r4path .'/php ./public/_assets/r4/');
		shell_exec('cp -r ./vendor/vendor/* ./public/_assets/vendor/');
	}

	shell_exec('php '. $r4path . $sep .'utils'. $sep .'templater.php');
	shell_exec('php '. $r4path . $sep .'utils'. $sep .'packer.php '. $jsPacker);

	escreve('Ok'. PHP_EOL);
}

function escreve($msg) {
	echo PHP_EOL . date('H:i:s ') . $msg;
}