<?php

echoc('');

if(!strpos($syspath, 'src')) {
	echoc('O novo módulo deve ser iniciado dentro da pasta src');
	die();
}

$moduleName = str_replace(' ', '', $moduleName);

if(empty($moduleName)) {
	echoc('É necessário informar um nome para o novo módulo');
	die();
}

if(file_exists($syspath . $moduleName)) {
	echoc('Pasta destino já existe, não é possível criar novo módulo');
	die();
}

$capname = ucwords($moduleName);

echoc('Criando pasta destino...');

mkdir($syspath . $moduleName);

echoc('Copiando arquivos base...');
if(PHP_OS_FAMILY == 'Windows') {
	shell_exec('Xcopy /r /s /e /c /q /y "'. $r4path .'utils\\initPack\\src\\users\\*" "'. $syspath . $moduleName .'"');
} else {
	shell_exec('cp -r '. $r4path .'utils/initPack/src/users/* '. $syspath . $moduleName);
}

echoc('Entrando na pasta do módulo...');
chdir($syspath . $moduleName);

echoc('Substituindo nome do módulo...');

replaceTxtAllFiles($syspath . $moduleName, 'users', $moduleName);
replaceTxtAllFiles($syspath . $moduleName, 'Users', $capname);
replaceTxtAllFiles($syspath . $moduleName, 'usuários', $capname);
replaceTxtAllFiles($syspath . $moduleName, 'Usuários', $capname);
replaceTxtAllFiles($syspath . $moduleName, 'idUser', 'id'. rtrim($capname, 's'));

echoc('Alterando nomes dos arquivos...');
rename('users.class.js',  $moduleName .'.class.js');
rename('users.class.php', $moduleName .'.class.php');
rename('templates/formUsers.html', 'templates/form'. $capname .'.html');

function replaceTxtAllFiles($path, $find, $replace) {
	$files = scandir($path);
	foreach($files as $file) {
		if(substr($file, 0, 1) != '.') {
			$pfile = $path .'/'. $file;
			if(is_dir($pfile)) replaceTxtAllFiles($pfile, $find, $replace);
			else file_put_contents($pfile, str_replace($find, $replace, file_get_contents($pfile)));
		}
	}
}