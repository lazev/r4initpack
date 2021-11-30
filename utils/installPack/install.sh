#!/bin/bash

echo -e '\e[1;33m'

echo 'The world`s greatest R4 installer';

composer -v > /dev/null 2>&1
COMPOSER=$?
if [[ $COMPOSER -ne 0 ]];
then

	echo -e '\e[1;31m'
	echo 'O PHP Composer não está instaldo.'
	echo -e '\e[0;31mEle é necessário para instalar os módulos de terceiros.';
	echo -e '\e[0;37m'

else

	echo ''
	echo -e '\e[1;37m'

	echo 'Informe o nome do sistema para criação da pasta ou em brando para não criar:'

	echo -e '\e[0;37m'

	read -p 'Nome do sistema : ' sysname


	if test -z  "$sysname"
	then
		echo 'Pulando criação da estrutura básica...'
	else

		echo 'Criando estrutura básica...'

		cd ..
		mkdir ../$sysname
		mkdir ../$sysname/src
		mkdir ../$sysname/vendor
		echo '{}' > ../$sysname/vendor/composer.json
		cp .compiler.json ../$sysname
		cp basic/* ../$sysname/src

	fi


	echo ''
	echo -e '\e[1;37m'

	echo 'Informe o usuário administrador do banco de dados (pode ser o root):'

	echo -e '\e[0;37m'

	read -p 'DB Admin: ' userdb


	echo ''
	echo -e '\e[1;37m'

	echo 'Agora informe a senha de acesso deste usuario ao BD:'

	echo -e '\e[0;37m'

	read -sp 'DB Pass: ' passdb


	echo ''

	echo -e '\e[1;37m'

	mysql -u $userdb -p$passdb -e "create database _sistema collate 'utf8mb4_general_ci';";

	mysql -u $userdb -p$passdb _sistema < utils/kickStartDB.sql

	cd modules

	composer install

	cd ..

	mkdir public

	echo -e '\e[1;34m'

	./compiler.php

	echo -e '\e[1;32m'

	echo 'Instalação finalizada com sucesso!'

	echo -e '\e[0;37m'

fi