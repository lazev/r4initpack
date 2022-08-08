<?php
session_name('R4SID'. substr(md5($_SERVER['REMOTE_ADDR'] . $_SERVER['HTTP_USER_AGENT']), 0, 5));
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

define('UNIXTIME',   time());

define('USER_IP',    ((isset($_SERVER['HTTP_X_FORWARDED_FOR']))
                     ? $_SERVER['HTTP_X_FORWARDED_FOR']
                     : $_SERVER['REMOTE_ADDR']));

define('ROOT_URL',   HTTP . $_SERVER['HTTP_HOST'] .'/{systemid}/public/');

define('ROOT',       pathinfo(__FILE__)['dirname'] .'/');

define('R4PHP',      ROOT .'_assets/r4/php/');

define('SYSTEMID',   '{systemid}');
define('DEVMODE',    true);

define('SECRETKEY',  $priv['secretkey']);

define('INDEXTABLE', '{systemid}');
define('INDEXDB',    'localhost');

define('DBUSER',     '{dbuser}');
define('DBPASS',     $priv['dbpass']);
define('DBSERVER',   INDEXDB);
define('DBTABLE',    (isset($_SESSION[SYSTEMID]['SELTABLE']))
                     ? $_SESSION[SYSTEMID]['SELTABLE']
                     : INDEXTABLE);