#!/usr/bin/php
<?php

echoc('The world`s greatest R4 installer', 'yellow');

$arr = explode(DIRECTORY_SEPARATOR, $syspath);
$sysname = array_pop($arr);
$sysname = array_pop($arr);

echoc('Inicializando conteúdo básico para '. $sysname);

copy($r4path .'utils/initPack/content.zip', $syspath .'content.zip');
chdir($syspath);
shell_exec('unzip content.zip');
unlink('content.zip');

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

do {
	echoc();

	echoc('Criar índice do sistema no banco de dados?');
	echo '( S ou N ): ';
	$cindex = strtolower(stream_get_line(STDIN, 1024, PHP_EOL));
}
while($cindex != 's' && $cindex != 'n');

if(strtolower($cindex) == 's') {
	shell_exec('mysql -u '. $dbuser .' -p'. $dbpass .' -e "create database _'. $systemid .' collate \'utf8mb4_general_ci\';";');
	shell_exec('mysql -u '. $dbuser .' -p'. $dbpass .' _'. $systemid .' < '. $r4path .'utils/initPack/indexDB.sql');
}

echoc();

$cfgfile = file_get_contents($syspath .'src/config.inc.php');

$key = [ '{systemid}', '{dbuser}' ];
$val = [  $systemid,    $dbuser   ];

$cfgfile = str_replace($key, $val, $cfgfile);

file_put_contents($syspath .'src/config.inc.php', $cfgfile);

$privfile = '#Arquivo deve estar em uma pasta segura, fora da public e src'. PHP_EOL
			 . '#Necessario que o src/config.inc.php aponte para este arquivo'. PHP_EOL
			 . 'dbpass="'. $dbpass .'"'. PHP_EOL .'secretkey="'. base64_encode(random_bytes(64)) .'"';
file_put_contents($syspath .'.r4priv_'. $systemid, $privfile);

chdir($syspath .'vendor');

shell_exec('composer install');

chdir($syspath);

echoc();

echoc('Informe a senha do sudo da máquina ou mova manualmente privado depois.');
echoc('No caso de Windows, coloque o arquivo em uma pasta segura e mude o caminho em src/config.inc.php');
echoc('sudo mv '. $syspath .'.r4priv_'. $systemid .' /etc/.r4priv_'. $systemid);
shell_exec('sudo mv '. $syspath .'.r4priv_'. $systemid .' /etc/.r4priv_'. $systemid);

echoc();

require $r4path .'utils/compiler.php';

echoc();

echoc('Instalação concluída', 'green');
