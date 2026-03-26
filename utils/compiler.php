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

if(isset($testMonitorInstance) && $testMonitorInstance > 1)
	echoc('ATENTION: You already have '. ($testMonitorInstance-1) .' R4 monitor running.', 'red', 'bold', '', 2);


if((count($argv) > 1 && $argv[1] == 'monitor') || (isset($monitor) && $monitor)) {

	$lockFile = sys_get_temp_dir() . '/r4_monitor_' . md5(getcwd()) . '.pid';
	checkAndRegisterInstance($lockFile);

	escreve('Monitoring...');

	monitorLoop($monitorFolders, function() {
		compile();
	}, pollMs: 500, debounceMs: 300);

} else {
	escreve('Single project update...');
	compile();
}


function getFilesState(array $folders): array {
	$state = [];
	foreach ($folders as $folder) {
		if (!is_dir($folder)) continue;

		$iter = new RecursiveIteratorIterator(
			new RecursiveDirectoryIterator($folder, RecursiveDirectoryIterator::SKIP_DOTS)
		);

		foreach ($iter as $file) {
			if (!$file->isFile()) continue;
			if (isTempFile($file->getFilename())) continue;
			$path = $file->getPathname();
			$state[$path] = $file->getMTime() . ':' . $file->getSize();
		}

	}
	ksort($state);
	return $state;
}


function diffState(array $prev, array $curr): array {
	$changes = [];
	foreach ($curr as $path => $sig) {
		if (!isset($prev[$path]))          $changes[] = "[+] $path";
		elseif ($prev[$path] !== $sig)     $changes[] = "[~] $path";
	}
	foreach ($prev as $path => $_) {
		if (!isset($curr[$path]))          $changes[] = "[-] $path";
	}
	return $changes;
}


function monitorLoop(array $folders, callable $onCompile, int $pollMs = 500, int $debounceMs = 300): void {
	$prevState    = getFilesState($folders);
	$pendingSince = null;

	while (true) {
		usleep($pollMs * 1000);
		clearstatcache();

		$currState = getFilesState($folders);

		if ($currState !== $prevState) {
			if ($pendingSince === null) {
				$pendingSince = hrtime(true);
			}

			$elapsedMs = (hrtime(true) - $pendingSince) / 1e6;

			if ($elapsedMs >= $debounceMs) {
				$changes = diffState($prevState, $currState);
				foreach ($changes as $change) escreve('  ' . $change);

				$onCompile();

				$prevState    = getFilesState($folders);
				$pendingSince = null;
				escreve('Monitorando...');
			}
		} else {
			$pendingSince = null;
		}
	}
}


function checkAndRegisterInstance(string $lockFile): void {

	if (file_exists($lockFile)) {
		$existingPid = (int)trim(file_get_contents($lockFile));

		if ($existingPid > 0 && isProcessRunning($existingPid)) {
			echoc('ATENÇÃO: Já existe um monitor R4 ativo (PID ' . $existingPid . ').', 'red', 'bold', '', 2);
		}
	}

	file_put_contents($lockFile, getmypid());

	register_shutdown_function(fn() => @unlink($lockFile));
}


function isProcessRunning(int $pid): bool {
	if (PHP_OS_FAMILY === 'Windows') {
		$out = shell_exec("tasklist /FI \"PID eq $pid\" 2>NUL");
		return str_contains($out ?? '', (string)$pid);
	}
	// Linux: /proc/{pid} existe enquanto o processo estiver vivo
	return file_exists("/proc/$pid");
}


function isTempFile(string $filename): bool {
	$patterns = [
		'/^\.giosave/',     // SFTP via GIO/Nautilus
		'/^\.~/',           // LibreOffice, WPS
		'/~$/',             // editores em geral
		'/\.swp$/',         // Vim
		'/\.swx$/',         // Vim
		'/^#.*#$/',         // Emacs
		'/^\.\#/',          // Emacs lock
		'/\.tmp$/',         // genérico
		'/^\.___jb_/',      // JetBrains (PHPStorm, etc.)
	];

	foreach ($patterns as $pattern) {
		if (preg_match($pattern, $filename)) return true;
	}
	return false;
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
