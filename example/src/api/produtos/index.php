<?php
require '../../config.inc.php';
require ROOT .'api/iniendapi.php';

require_once ROOT .'produtos/produtos.class.php';
$module = new Produtos;

function moduleRead($id) {
	global $module;
	return $module->read($id);
}

function moduleList($params=[]) {
	global $module;
	return $module->list();
}

function moduleSave($id=0, $params) {
	global $module;

	$id = (int)$id;

	if($id) {
		return $module->update($id, $params);
	} else {
		return $module->insert($params);
	}
}

function moduleDelete($id) {
	global $module;
	return $module->delete($id);
}

require ROOT .'api/iniendapi.php';