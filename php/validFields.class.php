<?php

class ValidFields {

	private $arrFields = array();
	private $retErrors = array();
	private $errorMap  = array(
		'notFound'   => 'Arquivo dos fields não encontrado',
		'errorOpen'  => 'Erro ao abrir o arquivo dos fields',
		'failRead'   => 'Falha ao ler o arquivo dos fields',
		'noFields'   => 'Sem fields encontrado para validação',
		'intValue'   => 'Apenas valores inteiros (sem vírgula)',
		'noSubZero'  => 'Valores negativos não são permitidos',
		'invalidVal' => 'Valor inválido',
		'required'   => 'Campo obrigatório',
		'minSize'    => 'Necessário informar no mínimo %2$s caracteres (tem %1$s agora)',
		'maxSize'    => 'O máximo permitido é de %2$s caracteres (tem %1$s agora)',
		'exactSize'  => 'O tamanho exato deve ser de %2$s caracteres (tem %1$s agora)',
		'pattern'    => 'O campo não está no padrão necessário',
		'hasErrors'  => 'Um ou mais erros de preenchimento encontrados'
	);
	private $prefix = ''; //usado para inserir um prefixo nos campos com erro
	private $sufix  = ''; //usado para inserir um sufixo nos campos com erro

	public $errMsg = '';
	public $errObs = '';
	public $errFields = [];

	public function setErrorMap($arrErrors) {
		foreach($arrErrors as $key => $val) {
			$this->errorMap[$key] = $val;
		}
	}

	public function getMsg($key, $att1='', $att2='') {
		return sprintf($this->errorMap[$key], $att1, $att2);
	}

	public function getValidateErrors() {
		return $this->retErrors;
	}

	public function setValidateErrors($retErrors) {
		$this->retErrors = $retErrors;
	}

	public function setErrorFieldsParams($params = null) {
		if($params) {
			$list = explode('|', $params);

			if(is_array($list) && (sizeof($list) == 2)) {
				$this->prefix = $list[0];
				$this->sufix  = $list[1];
			}
			else {
				return 'Erro ao informar prefixo e sufixo no Validador.';
			}
		}
	}


	public function addSchema($fieldsFile, $prefix='') {

		if(!file_exists($fieldsFile)) {
			$this->errMsg = $this->getMsg('notFound', $fieldsFile);
			return false;
		}
		if(!$fieldsStr = file_get_contents($fieldsFile)) {
			$this->errMsg = $this->getMsg('errorOpen', $fieldsFile);
			return false;
		}

		if(!$arrFieldsTmp = json_decode($fieldsStr, true)) {
			$this->errMsg = $this->getMsg('failRead', $fieldsFile);
			return false;
		}

		if($prefix) {
			foreach($arrFieldsTmp[$prefix] as $field) $arrFields[$field['id']] = $field;
		} else {
			foreach($arrFieldsTmp as $field) $arrFields[$field['id']] = $field;
		}

		if(!count($this->arrFields)) {
			$this->arrFields = $arrFields;
		} else {
			$this->arrFields = array_merge($this->arrFields, $arrFields);
		}
		return true;
	}


	public function valid($arrData) {

		if(!is_array($this->arrFields)) {
			$this->errMsg = $this->getMsg('noFields');
			return false;
		}

		foreach($arrData as $field => $value) {
			if (empty($this->arrFields[$field])) {
				continue;
			}
			$this->validateType($field, $value, $this->arrFields[$field]['type']);
			$this->validateAttr($field, $value, $this->arrFields[$field]);
		}

		if(count($this->getValidateErrors())) {
			$this->errMsg = $this->getMsg('hasErrors');
			return false;
		}
		return true;
	}


	private function validateType($field, $value, $type) {
		if(empty($value)) return true;
		switch($type) {
			case 'integer':
			case 'integer-':
				if($value != Roda::onlyNumbers($value)) {
					$this->retErrors[$this->prefix . $field . $this->sufix][] = $this->getMsg('intValue', $value);
					return false;
				}
				if(($type == 'integer') && ($value < 0)) {
					$this->retErrors[$this->prefix . $field . $this->sufix][] = $this->getMsg('noSubZero', $value);
					return false;
				}
			break;

			case 'decimal':
			case 'decimal-':
			case 'money':
			case 'money-':
				if(!is_numeric($value)) {
					$this->retErrors[$this->prefix . $field . $this->sufix][] = $this->getMsg('invalidVal', $value);
					return false;
				}
				if(($type == 'money') || ($type == 'decimal')) {
					if($value < 0) {
						$this->retErrors[$this->prefix . $field . $this->sufix][] = $this->getMsg('noSubZero', $value);
						return false;
					}
				}
			break;
			case 'date':
				if(!empty($value) && $value != '0000-00-00'
				&& $value != '0000-00-00 00:00:00'
				&& !Roda::isDate($value)) {
					$this->retErrors[$this->prefix . $field . $this->sufix][] = $this->getMsg('pattern', $value);
					return false;
				}
			break;

			default:
				return true;
		}
	}


	private function validateAttr($field, $value, $attrs) {

		if(is_array($attrs)) {
			foreach($attrs as $attr => $limit) {
				if(($attr != 'id') && ($attr != 'type')) {
					if((strtolower($attr) == 'require') || (strtolower($attr) == 'required')) {
						if($limit == 'true') {
							if($value == '') {
								$this->retErrors[$this->prefix . $field . $this->sufix][] = $this->getMsg('required', $value, $limit);
							}
						}
					}

					if(strtolower($attr) == 'minsize') {
						if(strlen($value) < $limit) {
							if(!empty($value)) {
								$this->retErrors[$this->prefix . $field . $this->sufix][] = $this->getMsg('minSize', strlen($value), $limit);
							}
						}
					}

					if(strtolower($attr) == 'maxsize') {
						if(strlen($value) > $limit) {
							$this->retErrors[$this->prefix . $field . $this->sufix][] = $this->getMsg('maxSize', strlen($value), $limit);
						}
					}

					if(strtolower($attr) == 'exactsize') {
						if(strlen($value) != 0) {
							$tmperr = true;
							$tmp = explode(',', $limit);
							foreach($tmp as $siz) {
								if(strlen($value) == $siz) $tmperr = false;
							}
							if($tmperr) {
								$this->retErrors[$this->prefix . $field . $this->sufix][] = $this->getMsg('exactSize', strlen($value), str_replace(',', ', ', $limit));
							}
						}
					}

					if(strtolower($attr) == 'regex') {
						if(!preg_match("/$val/i", $value)) {
							$this->retErrors[$this->prefix . $field . $this->sufix][] = $this->getMsg('pattern', $value, $limit);
						}
					}
				}
			}
		}
		return true;
	}
}