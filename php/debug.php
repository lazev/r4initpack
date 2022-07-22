<?php
require '../../../config.inc.php';

if(!defined('DEVMODE') || !DEVMODE) {
	die('Não está em ambiente de desenvolvimento');
}

$busca = $_REQUEST['busca'] ?? '';

echo '
<style>
body {
	background: #333;
	color: #EFEFEF;
}
</style>
<script>
function nl2br(elem) {
	elem.innerHTML = elem.innerHTML.replaceAll("\\\n", "<br>").replaceAll("\\\t", " ");
}
</script>

<p>'. USER_IP .'</p>
';


$r4log = scandir('/var/log/r4/');

echo '<form method="get"><input name="busca" value="'. $busca .'" placeholder="Filtrar"></form>';

foreach($r4log as $val) {
	if(substr($val, 0, 1) == '.') continue;

	if(empty($busca)) {
		$log = htmlentities(`tail -n20 /var/log/r4/$val`);
	} else {
		$log = htmlentities(`grep '$busca' /var/log/r4/$val | tail -n20`);
	}

	$lines = explode(PHP_EOL, $log);

	echo $val .': <div style="width: 95%; overflow: auto"><table>';

	foreach($lines as $line) {
		if(empty($line)) continue;

		echo '<tr>';
		$cols = explode('|', $line);

		foreach($cols as $key => $col) {
			if($key == 4) {
				echo '<td><pre onclick="nl2br(this);">'. $col .'</pre></td>';
			} else {
				echo '<td>'. $col .'</td>';
			}
		}

		echo '</tr>';
	}

	echo '</table></div>';
}




echo '<pre><div style="background: black; color: white; padding: 5px; width: 95%; overflow: auto">';

$host = $_SERVER['HTTP_HOST'];
$subdom = substr($host, 0, strpos($host, '.'));

if ($subdom  == 'gilberto'){
	$log = htmlentities(`tail -n20 /var/log/nginx/gilberto.error.log`);
}else if ($subdom  == 'vini'){
	$log = htmlentities(`tail -n20 /var/log/nginx/vini.error.log`);
}else if ($subdom  == 'mario'){
	$log = htmlentities(`tail -n20 /var/log/nginx/mario.error.log`);
}


$sai   = [
	'PHP message:',
	'PHP Warning:',
	'PHP Fatal error:',
	'PHP Parse error:',
	'PHP Notice:',
	'MySQL error'
];
$entra = [
	'<br><span style="color: #4D4D4D;">PHP message:</span>',
	'<br><span style="color: #FFC355;">PHP Warning:</span>',
	'<br><span style="color: #FFC0CB;">PHP Fatal error:</span>',
	'<br><span style="color: #FFC0CB;">PHP Parse error:</span>',
	'<br><span style="color: #1E90FF;">PHP Notice:</span>',
	'<br><span style="color: #FFC0CB;">MySQL error</span>'
];
$log = str_replace($sai, $entra, $log);

echo $log;

echo '</div>';





print_r($_SESSION);

print_r($_SERVER);

echo '</pre>';

phpinfo();