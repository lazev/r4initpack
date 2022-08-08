#!/usr/bin/php
<?php

echoc('The world`s greatest R4 installer', 'yellow');

$arr = explode($sep, $syspath);
$sysname = array_pop($arr);
$sysname = array_pop($arr);

$naoVazio = false;
$testdest = scandir($syspath);
foreach($testdest as $key => $val) {
	if($val == '.' || $val == '..') continue;
	$naoVazio = true;
}

if($naoVazio) {

	do {
		echoc();

		echoc('A pasta de destino não está vazia. Este comando deve ser rodado dentro da pasta onde ficará o novo projeto. '. PHP_EOL .'Normalmente novas instalação são feitas em pastas vazias. Continuar mesmo assim?');
		echo '( S ou N ): ';
		$simnao = strtolower(stream_get_line(STDIN, 1024, PHP_EOL));
	}
	while($simnao != 's' && $simnao != 'n');

	if($simnao == 'n') {
		die('Instalação abortada');
	}
}

echoc('Inicializando conteúdo básico para '. $sysname);

if(!is_dir($r4path .'utils'. $sep .'initPack')) {
	die('Pacote de conteúdo básico não encontrado no instalador. Instalação abortada.');
}

if(PHP_OS_FAMILY == 'Windows') {
	shell_exec('Xcopy /r /s /e /c /q /y "'. $r4path .'utils\initPack\*" "'. $syspath .'"');
	echoc('copiado');
} else {
	shell_exec('cp -r '. $r4path .'utils/initPack/* '. $syspath);
}

unlink($syspath .'indexDB.sql');

echoc('Informe o nome (apelido) do sistema. Uma só palavra ['. $sysname .']:');
$systemid = str_replace(' ', '', trim(stream_get_line(STDIN, 1024, PHP_EOL)));

if(empty($systemid)) {
	$systemid = $sysname;
}

echoc('Informe o nome do usuário administrador do banco de dados:');
echo 'DB username: ';
$dbuser = stream_get_line(STDIN, 1024, PHP_EOL);

echoc();

echoc('Informe a senha de acesso deste usuário ao banco de dados:');
echo 'DB password: ';
$dbpass = stream_get_line(STDIN, 1024, PHP_EOL);

$simnao = '';
do {
	echoc();

	echoc('Criar índice do sistema no banco de dados?');
	echo '( S ou N ): ';
	$simnao = strtolower(stream_get_line(STDIN, 1024, PHP_EOL));
}
while($simnao != 's' && $simnao != 'n');

if(strtolower($simnao) == 's') {
	shell_exec('mysql -u '. $dbuser .' -p'. $dbpass .' -e "create database '. $systemid .' collate \'utf8mb4_general_ci\';";');
	shell_exec('mysql -u '. $dbuser .' -p'. $dbpass .' '. $systemid .' < '. $r4path .'utils'. $sep .'initPack'. $sep .'indexDB.sql');
}

echoc();
$simnao = '';
do {
	echoc();

	echoc('Instalar o Composer?');
	echo '( S ou N ): ';
	$simnao = strtolower(stream_get_line(STDIN, 1024, PHP_EOL));
}
while($simnao != 's' && $simnao != 'n');

if(strtolower($simnao) == 's') {
	copy('https://getcomposer.org/installer', 'composer-setup.php');
	if (hash_file('sha384', 'composer-setup.php') === '55ce33d7678c5a611085589f1f3ddf8b3c52d662cd01d4ba75c0ee0459970c2200a51f492d557530c71c15d8dba01eae') {
		echo 'Composer Installer verified';
	} else {
		echo 'Composer Installer corrupt';
		unlink('composer-setup.php');
	}
	echoc();

	shell_exec('php composer-setup.php');

	unlink('composer-setup.php');
}

echoc();

$cfgfile = file_get_contents($syspath .'src'. $sep .'config.inc.php');

$key = [ '{systemid}', '{dbuser}' ];
$val = [  $systemid,    $dbuser   ];

$cfgfile = str_replace($key, $val, $cfgfile);

file_put_contents($syspath .'src'. $sep .'config.inc.php', $cfgfile);

$privfile = '#Arquivo deve estar em uma pasta segura, fora da public e src'. PHP_EOL
          . '#Necessario que o src'. $sep .'config.inc.php aponte para este arquivo'. PHP_EOL
          . 'dbpass="'. $dbpass .'"'. PHP_EOL .'secretkey="'. base64_encode(random_bytes(64)) .'"';

file_put_contents($syspath .'.r4priv_'. $systemid, $privfile);

chdir($syspath .'vendor');

shell_exec('php ../composer.phar install');

chdir($syspath);

echoc();

if(PHP_OS_FAMILY == 'Windows') {
	echoc('Coloque o arquivo .r4priv_'. $systemid .' em uma pasta segura e mude o caminho em src'. $sep .'config.inc.php');
}
else {
	echoc('Informe a senha do sudo da máquina ou mova manualmente privado depois.');
	echoc('sudo mv '. $syspath .'.r4priv_'. $systemid .' '. $sep .'etc'. $sep .'.r4priv_'. $systemid);
	shell_exec('sudo mv '. $syspath .'.r4priv_'. $systemid .' '. $sep .'etc'. $sep .'.r4priv_'. $systemid);


	echoc('Criando pasta de logs /var/log/r4...');
	shell_exec('sudo mkdir /var/log/r4');
}

echoc();

require $r4path .'utils'. $sep .'compiler.php';

echoc();

echoc('Instalação concluída', 'green');
echoc('https://localhost/'. $systemid .'/public/', 'yellow');