<?php

$rootFolder = './public/';

$templatesPath = './src/_assets/templates/';

$templatesArr = [];

$arrFiles = scandir($templatesPath);

foreach($arrFiles as $file) {
	if((substr($templatesPath . $file, -4) == 'html') || (substr($templatesPath . $file, -3) == 'htm')) {
		$tconterCont = file_get_contents($templatesPath . $file);

		if(strpos($tconterCont, '/R4TEMPLATE') !== false) { //deprecated
			$arr = explode('<!--/R4TEMPLATE-->', $tconterCont);
			if(is_array($arr)) foreach($arr as $item) {
				$item = trim($item);
				if(!empty($item)) $templatesArr[] = $item;
			}
		} else {
			$arr = explode('<!--R4TEMPLATE', $tconterCont);
			if(is_array($arr)) foreach($arr as $item) {
				$item = trim($item);
				if(!empty($item)) $templatesArr[] = '<!--R4TEMPLATE'. $item;
			}
		}
	}
}


foreach($templatesArr as $tcont) {

	$tcont = trim($tcont);

	if(!empty($tcont)) {

		preg_match_all('|\<!--R4TEMPLATE-(.*)--\>|', $tcont, $match);

		$tid   = $match[0][0];
		//$tcont .= PHP_EOL .'<!--/R4TEMPLATE-->';

		searchAll($rootFolder, $tid, $tcont);
	}
}

moduleSearchAll($rootFolder);


function searchAll($rootFolder, $tid, $tcont) {
	global $templatesPath;

	$arrFiles = scandir($rootFolder);

	foreach($arrFiles as $file) {
		if(substr($file, 0, 1) == '.') continue;

		if(is_dir($rootFolder . $file) && !is_link($rootFolder . $file))  {

			if($rootFolder . $file == $templatesPath) continue;

			searchAll($rootFolder . $file .'/', $tid, $tcont);

		} else {

			if((substr($rootFolder . $file, -4) == 'html') || (substr($rootFolder . $file, -3) == 'htm')) {
				replacer($rootFolder . $file, $tid, $tcont);
			}
		}
	}
}


function replacer($filename, $tid, $tcont) {

	$filecont = file_get_contents($filename);

	if($tid) {
		$filecont = str_replace($tid, $tcont, $filecont);
	}

	$filecont = cacheReplacer($filecont, $filename);

	file_put_contents($filename, $filecont);
}


//Substitui links que comecem por R4Cache:: por link?unixtime da
//data de modificação do arquivo linkado para evitar o cache.

function cacheReplacer($content, $filename) {
	preg_match_all('|R4Cache::(\S*)\"|m', $content, $outArr);

	foreach($outArr[1] as $item) {
		$sep = '?';
		$tritem = $item;

		if(strpos($item, '?') !== false) {
			$sep = '&';
			$tritem = explode('?', $item)[0];
		}

		if(!file_exists('src/'. $tritem)) {
			echo PHP_EOL . PHP_EOL . 'File not found: '. $tritem .' in '. $filename;
		} else {
			$content = str_replace(
				'R4Cache::'. $item,
				$item . $sep . filemtime('src/'.$tritem),
				$content
			);
		}

	}

	return str_replace('R4Cache::', '', $content);
}




//Se o módulo contém um index.html e uma pasta chamada templates,
//coloca todo o conteúdo dos arquivos html da pasta templates
//para dentro do arquivo index.html
function moduleSearchAll($rootFolder) {
	global $templatesPath;

	$arrFiles = scandir($rootFolder);

	foreach($arrFiles as $file) {
		if(substr($file, 0, 1) == '.') continue;

		if(is_dir($rootFolder . $file) && !is_link($rootFolder . $file)) {

			if($rootFolder . $file == $templatesPath) continue;

			if($file == 'templates') {

				$templ = '';
				$templateFiles = scandir($rootFolder . $file .'/');

				foreach($templateFiles as $tfile) {
					$tpath = $rootFolder . $file .'/'. $tfile;

					if((substr($tpath, -4) == 'html') || (substr($tpath, -3) == 'htm')) {
						$templ .= file_get_contents($tpath);
					}
				}
				if(file_exists($rootFolder .'index.html')) {
					moduleReplacer($rootFolder .'index.html', $templ);
				}

			} else {
				moduleSearchAll($rootFolder . $file .'/');
			}
		}
	}
}


function moduleReplacer($filename, $templates) {
	$filecont = file_get_contents($filename);
	$filecont = str_replace('</body>', $templates .'</body>', $filecont);

	file_put_contents($filename, $filecont);
}