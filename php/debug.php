<?php
require '../../../config.inc.php';

if(!defined('DEVMODE') || !DEVMODE) {
	die('Não está em ambiente de desenvolvimento');
}

$busca = $_REQUEST['busca'] ?? '';
?>

<html>
	<head>
		<link rel="icon" type="image/png" sizes="16x16" href="data:image/png;base64,
	iVBORw0KGgoAAAANSUhEUgAAABAAAAAQBAMAAADt3eJSAAAAMFBMVEU0OkArMjhobHEoPUPFEBIu
	O0L+AAC2FBZ2JyuNICOfGx7xAwTjCAlCNTvVDA1aLzQ3COjMAAAAVUlEQVQI12NgwAaCDSA0888G
	CItjn0szWGBJTVoGSCjWs8TleQCQYV95evdxkFT8Kpe0PLDi5WfKd4LUsN5zS1sKFolt8bwAZrCa
	GqNYJAgFDEpQAAAzmxafI4vZWwAAAABJRU5ErkJggg==" />
		<style>
		body {
			background: #121212 !important;
			color: #EFEFEF !important;
		}
		.hide {
			display: none;
		}

		table tr td {
			white-space: nowrap;
		}

		.phpinfo * {
			color: black;
		}
		</style>
	</head>
	<body>
<?php

echo '<p>'. USER_IP .'</p>';

$rootPath = '/var/log/r4/';

$r4log = scandir($rootPath);


echo '<form method="get"><input name="busca" value="'. $busca .'" placeholder="Filtrar"></form>';

foreach($r4log as $val) {

	$logfile = [];

	if(substr($val, 0, 1) == '.') continue;

	if(is_dir($rootPath . $val)) {
		$folder = $val;
		$sublog = scandir($rootPath . $folder);
		foreach($sublog as $item) {
			if(substr($item, 0, 1) == '.') continue;
			$logfile[] = $folder .'/'. $item;
		}
	}
	else {
		$logfile[] = $val;
	}


	foreach($logfile as $val) {

		if(empty($busca)) {
			$log = htmlentities(`tail -n20 /var/log/r4/$val`);
		} else {
			$log = htmlentities(`grep '$busca' /var/log/r4/$val | tail -n20`);
		}

		$lines = explode(PHP_EOL, $log);

		echo '
			<div target="'. $val .'" style="cursor: pointer;"><b>'. $val .'</b>:</div>
			<div id="'. $val .'" style="width: 95%; overflow: auto;" class="hide"><table>
		';

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
}

$host = $_SERVER['HTTP_HOST'];
$subdom = substr($host, 0, strpos($host, '.'));

/*
if(file_exists('/var/log/nginx/'. $subdom .'.error.log')) {
	$logName = $subdom .'.error.log';
	$log = htmlentities(`tail -n20 /var/log/nginx/$subdom.error.log`);
} else {
*/
	$logName = 'error.log';
	$log = htmlentities(`tail -n20 /var/log/nginx/error.log`);
//}

$sai = [
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

echo '
	<hr>
	<b>'. $logName .'</b>
	<pre>
	<div style="background: black; color: white; padding: 5px; width: 95%; overflow: auto">'
		. $log
	.'</div>';

print_r($_SESSION);

print_r($_SERVER);
?>
</pre>
<script>

let elems = document.querySelectorAll('div[target]');

if(elems) {
	elems.forEach(item => {
		item.addEventListener('click', function(ev) {
			let target = this.getAttribute('target');
			document.getElementById(target).classList.toggle('hide');
			let json = localStorage.getItem('debugLayout') ?? '{}';
			let arr = JSON.parse(json);
			arr[target] = (document.getElementById(target).classList.contains('hide')) ? '' : 'show';
			localStorage.setItem('debugLayout', JSON.stringify(arr));
		});
	});
}

let layouts = JSON.parse(localStorage.getItem('debugLayout') ?? '{}');
for(item in layouts) {
	if(layouts[item] == 'show') {
		if(document.getElementById(item)) {
			document.getElementById(item).classList.remove('hide');
		}
	}
}

function nl2br(elem) {
	console.log(elem.innerHTML.replaceAll("\\n", "\n").replaceAll("\\t", "\t"));
	elem.innerHTML = elem.innerHTML.replaceAll("\\n", "<br>").replaceAll("\\t", " ");
}
</script>

<div class="phpinfo">
<?php phpinfo(); ?>
</div>

</body>
</html>