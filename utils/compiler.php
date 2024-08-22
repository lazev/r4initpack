#!/usr/bin/php
<?php

$cfgfile = 'r4.json';

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

$monitorFolders = $cfg['foldersToMonitor'];

escreve('Running on ' . PHP_OS_FAMILY);

if($testMonitorInstance > 1)
	echoc('ATENTION: You already have '. ($testMonitorInstance-1) .' R4 monitor running.', 'red', 'bold', '', 2);


$past = '';
if((count($argv) > 1 && $argv[1] == 'monitor') || (isset($monitor) && $monitor)) {

	escreve('Monitoring...');

	while(true) {
		$ls = getLsHash();
		if($past != $ls) {
			escreve('Changes detected...');
			sleep(1);
			compile();
			escreve('Monitoring...');
			$past = getLsHash();
		} else {
			$past = $ls;
		}
		sleep(2);
	}

} else {
	escreve('Single project update...');
	compile();
}


function getLsHash() {
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
	global $sep, $r4path, $cfgfile;

	escreve('Updating codes...');

	if(!file_exists('./public')) {
		escreve('ERRO: pasta public não encontrada. Crie na raíz do projeto, ao lado da pasta src'. PHP_EOL);
		die();
	}

	if(PHP_OS_FAMILY == 'Windows') {
		shell_exec('rmdir /s /q ".\public"');
		shell_exec('mkdir "./public"');
		shell_exec('mkdir "./public/_assets"');
		shell_exec('mkdir "./public/_assets/r4"');
		echo shell_exec('Xcopy  /r /s /e /c /q /y "./src" "./public"');
		shell_exec('Xcopy /r /s /e /c /q /y "'. $r4path .'php" "./public/_assets/r4/php"');
		shell_exec('Xcopy /r /s /e /c /q /y "./vendor/vendor" "./public/_assets/vendor"');
	} else {
		shell_exec('rm -rf ./public/*');
		shell_exec('mkdir ./public/_assets');
		shell_exec('mkdir ./public/_assets/r4');
		shell_exec('cp -r ./src/* ./public/');
		shell_exec('cp -r '. $r4path .'php ./public/_assets/r4/');
		shell_exec('cp -r ./vendor/* ./public/_assets/');
	}

	unlink('./public/_assets/php/composer.json');
	unlink('./public/_assets/php/composer.lock');

	$output = [];
	exec('php '. $r4path .'utils'. $sep .'templater.php', $output);

	foreach($output as $line) {
		if($line) escreve('Templater: '. $line);
	}

	$output = [];
	exec('php '. $r4path .'utils'. $sep .'packer.php '. $cfgfile, $output);

	foreach($output as $line) {
		if($line) escreve('Packer: '. $line);
	}

	escreve('Ok'. PHP_EOL);
}

function escreve($msg) {
	echo PHP_EOL . date('H:i:s ') . $msg;
}