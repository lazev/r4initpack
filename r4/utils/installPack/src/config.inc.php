<?php

session_start();

if(isset($_SERVER['HTTP_X_FORWARDED_PROTO'])) {
	$http = $_SERVER['HTTP_X_FORWARDED_PROTO'] .'://';
} else {
	$http = (isset($_SERVER['HTTPS'])) ? 'https://' : 'http://';
}

//Force https
$http = 'https://';

$priv = parse_ini_file('/etc/.r4priv_{systemid}');

define('HTTP',       $http);

define('USER_IP',    ((isset($_SERVER['HTTP_X_FORWARDED_FOR']))
                     ? $_SERVER['HTTP_X_FORWARDED_FOR']
                     : $_SERVER['REMOTE_ADDR']));

define('ROOT_URL',   HTTP . $_SERVER['HTTP_HOST'] .'/');

define('ROOT',       pathinfo(__FILE__)['dirname'] .'/');

define('R4PHP',      ROOT .'_assets/r4/php/');

define('SYSTEMID',   '{systemid}');
define('DEVMODE',    true);

define('SECRETKEY',  $priv['secretkey']);

define('INDEXDB',       'localhost'    );
define('INDEXTABLE',    '_{systemid}'  );
define('NEWACCOUNTSDB', 'localhost'    );
define('DBUSER',        '{dbuser}'     );
define('DBPASS',        $priv['dbpass']);

define('DBTABLE',       (isset($_SESSION[SYSTEMID]['SELTABLE']))
                        ? $_SESSION[SYSTEMID]['SELTABLE']
                        : INDEXTABLE);