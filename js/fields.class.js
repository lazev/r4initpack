var Fields = {

	listActiveErrFields: {},

	iconShowPass: '<svg xmlns="http://www.w3.org/2000/svg" class="icon" viewBox="0 0 16 16"><path d="M16 8s-3-5.5-8-5.5S0 8 0 8s3 5.5 8 5.5S16 8 16 8zM1.173 8a13.133 13.133 0 0 1 1.66-2.043C4.12 4.668 5.88 3.5 8 3.5c2.12 0 3.879 1.168 5.168 2.457A13.133 13.133 0 0 1 14.828 8c-.058.087-.122.183-.195.288-.335.48-.83 1.12-1.465 1.755C11.879 11.332 10.119 12.5 8 12.5c-2.12 0-3.879-1.168-5.168-2.457A13.134 13.134 0 0 1 1.172 8z"/><path d="M8 5.5a2.5 2.5 0 1 0 0 5 2.5 2.5 0 0 0 0-5zM4.5 8a3.5 3.5 0 1 1 7 0 3.5 3.5 0 0 1-7 0z"/></svg>',

	createFromFile: function(source, fieldsPrefix) {
		return new Promise((resolve, reject) => {
			if(!fieldsPrefix) fieldsPrefix = '';

			R4.getJSON(source, '', {method: 'GET'})

			.then(json => {

				for(let k in json) {
					//If it's not an integer, then it's a prefix to fields group
					if(!Number.isInteger(k)) {
						Fields.create(json[k], k);
					} else {
						Fields.create(json[k], fieldsPrefix);
						break;
					}
				}

				resolve();
			})
			.catch(() => {
				reject('Erro ao abrir o JSON do fields');
			});
		});
	},


	create: function(jsonFields, prefix) {

		return new Promise(resolve => {

			var item, elem, rcpt, label, arrFields = [];

			if(!prefix) prefix = '';

			if(jsonFields.length) arrFields = jsonFields;
			else arrFields.push(jsonFields);

			for(let k in arrFields) {

				elem = null;
				item = arrFields[k];

				rcpt = document.getElementById(
					(prefix) ? prefix +'_'+ item.id : item.id
				);

				if(!rcpt) continue;

				label = rcpt.innerHTML;
				if(label) item.label = label;

				switch(item.type) {
					case 'select':
						elem = Fields.createSelect(item, prefix);
						break;

					case 'switch':
						elem = Fields.createSwitch(item, prefix);
						break;

					case 'button':
					case 'submit':
					case 'reset':
						elem = Fields.createButton(item, prefix);
						break;

					default:
						elem = Fields.createInput(item, prefix);
				}

				if(!elem) continue;

				rcpt.id += '_rcpt';

				if(item.type == 'hidden') rcpt.classList.add('hidden');

				rcpt.innerHTML = '';

				rcpt.append(elem);
			}

			resolve(true);
		});
	},


	createInput: function(item, prefix) {

		let elem, type, inputmode, label, passEye, tagList;

		let id   = (prefix)   ? prefix +'_'+ item.id : item.id;
		let name = item.name || item.id;

		item.id = id;

		let attrib = {
			id: id,
			name: name,
			autocomplete: 'off',
			R4Type: item.type
		};

		let wrap = document.createElement('div');

		wrap.setAttribute('class', 'R4Fields');

		if(type)             attrib.type        = type;
		if(inputmode)        attrib.inputmode   = inputmode;
		if(item.value)       attrib.value       = item.value;
		if(item.placeholder) attrib.placeholder = item.placeholder;
		if(item.classes)     attrib.classes     = item.classes;

		if(item.attr) {
			for(let k in item.attr) attrib[k] = item.attr[k];
		}

		if(item.label) {
			label = document.createElement('label');
			label.setAttribute('for', attrib.id);
			label.innerHTML = item.label;
		}

		if(attrib.value) {
			wrap.classList.add('withContent');
		}

		if(item.type == 'textarea') {
			elem = document.createElement('textarea');

			if(item.autosize) {
				elem.addEventListener('keyup', function(){
					if(elem.clientHeight < elem.scrollHeight) {
						let limit = 0;
						while(elem.offsetHeight < elem.scrollHeight) {
							elem.style.height = elem.offsetHeight+3 +'px';
							limit++;
							if(limit >= 100) break;
						}
					}
					else {
						let limit = 0;
						while(elem.offsetHeight >= elem.scrollHeight) {
							elem.style.height = elem.offsetHeight-3 +'px';
							limit++;
							if(limit >= 100) break;
						}
						elem.style.height = elem.offsetHeight+3 +'px';
					}
				});
			}
		}

		else {
			elem = document.createElement('input');
			elem.setAttribute('type', 'text');

			switch(item.type) {
				case 'tags':
				case 'emailtags':
				case 'phonetags':
					tagList = document.createElement('span');
					tagList.classList.add('tagList');

					wrap.classList.add('tags');
					wrap.classList.add(item.type);
					wrap.append(tagList);

					elem = FieldsTags.create(elem, item);

					if(item.type == 'phonetags') {
						elem.addEventListener('input', function(){ this.value = R4.phoneMask(this.value); });
					}

					break;

				case 'username':
					elem.addEventListener('input', function(){ this.value = R4.friendlyName(this.value); });
					break;

				case 'password':
					type = item.type;
					passEye = document.createElement('span');
					passEye.setAttribute('class', 'passEye');
					passEye.innerHTML = Fields.iconShowPass;
					passEye.addEventListener('click', function(){
						elem.setAttribute(
							'type',
							elem.getAttribute('type') === 'password' ? 'text' : 'password'
						);
					});
					break;

				case 'date':
					type = 'text';
					inputmode = 'date';

					elem.addEventListener('click', function(){
						Pop.create({
							destiny: elem,
							html: FieldsDtPicker.create(elem)
						});
					});

					elem.addEventListener('focus', function(){
						Pop.create({
							destiny: elem,
							html: FieldsDtPicker.create(elem),
							classes: 'corner shadow'
						});
					});

					elem.addEventListener('blur', function(){
						elem.value = R4.completeDate(elem.value);
						Pop.destroyByParent(elem);
					});

					elem.addEventListener('keydown', function(ev){
						if(ev.keyCode == 9) Pop.destroyByParent(elem, true);
						else if(ev.keyCode == 13) {
							let today        = new Date();
							let currentMonth = today.getMonth()+1;
							let currentYear  = today.getFullYear();
							let currentDay   = today.getDate();
							if(currentDay   < 10) currentDay   = '0'+ currentDay;
							if(currentMonth < 10) currentMonth = '0'+ currentMonth;
							Fields.setVal(elem, currentYear +'-'+ currentMonth  +'-'+ currentDay);
						}
					});

					break;

				case 'datetime':
					type = 'text';
					inputmode = 'datetime-local';
					break;

				case 'integer':
				case 'integer-':
					type = 'text';
					inputmode = 'numeric';

					elem.addEventListener('input', function(){ this.value = R4.integerMask(this.value); });

					if(item.type == 'integer') {
						if(item.min < 0) item.min = 0;
					}
					break;

				case 'money':
				case 'money-':
				case 'decimal':
				case 'decimal-':
					type = 'text';
					inputmode = 'decimal';

					elem = Fields.setCalcEvents(elem);
					elem.addEventListener('input', function(){ this.value = R4.decimalInputMask(this.value); });

					break;

				case 'cep':
					type = 'tel';
					elem.addEventListener('input', function(){ this.value = R4.cepMask(this.value); });
					break;

				case 'cpf':
				case 'cnpj':
				case 'cpfcnpj':
					type = 'tel';
					elem.addEventListener('input', function(){ this.value = R4.cpfcnpjMask(this.value); });
					break;

				case 'phone':
					type = 'tel';
					elem.addEventListener('input', function(){ this.value = R4.phoneMask(this.value); });
					break;

				case 'hidden':
					type = 'hidden';
					break;

				default:
					type = 'text';
			}
		}

		elem.setAttribute('type', type);

		wrap.append(elem);

		if(passEye) wrap.append(passEye);

		if(type != 'hidden') {
			let bar  = document.createElement('div');
			bar.setAttribute('class', 'bar');
			wrap.append(bar);
		}

		if(label) wrap.append(label);

		for(let k in attrib) elem.setAttribute(k, attrib[k]);

		if(item.type != 'tags' && item.type != 'emailtags' && item.type != 'phonetags') {
			elem.addEventListener('blur', function(event){
				if(event.target.value) {
					wrap.classList.add('withContent');
				} else {
					wrap.classList.remove('withContent');
				}
			});
		}

		Fields.setValidateRules(elem, item);

		return wrap;
	},


	createSelect: function(item, prefix) {

		let elem, label;

		let id   = (prefix)   ? prefix +'_'+ item.id : item.id;
		let name = item.name || item.id;

		let attrib = {
			id:   id,
			name: name
		};

		elem = document.createElement('select');

		if(item.classes)  attrib.classes  = item.classes;
		if(item.multiple) attrib.multiple = item.multiple;

		if(item.attr) {
			for(let k in item.attr) attrib[k] = item.attr[k];
		}

		for(let k in attrib) elem.setAttribute(k, attrib[k]);

		if(item.label) {
			label = document.createElement('label');
			label.innerHTML = item.label;
		}

		let wrap = document.createElement('div');
		wrap.setAttribute('class', 'R4Fields');
		wrap.append(elem);
		wrap.append(label);

		elem.addEventListener('blur', function(){
			if(this.selectedIndex > -1 && this.options[this.selectedIndex].innerHTML) {
				wrap.classList.add('withContent');
			} else {
				wrap.classList.remove('withContent');
			}
		});

		if(item.options) {
			Fields.setSelectOpts(elem, item.options, item.value);
		}

		Fields.setValidateRules(elem, item);

		return wrap;
	},


	setSelectOpts: function(elem, options, value) {

		elem.innerHTML = '';

		if(typeof options === 'string') {
			if(typeof eval(options) === 'object') {
				options = eval(options);
			}
		}

		let opt;

		for(let k in options) {
			if(typeof options[k] == 'string') {
				opt = document.createElement('option');

				opt.setAttribute('value', k);
				opt.innerHTML = options[k];

				if(value == k)
					opt.setAttribute('selected', 'selected');

				elem.append(opt);
			}
			else if(typeof options[k] == 'object') {
				if(typeof options[k].key == 'string' || typeof options[k].key == 'number') {

					opt = document.createElement('option');

					opt.setAttribute('value', options[k].key);
					opt.innerHTML = options[k].value;

					if(typeof options[k].classes != 'undefined')
						opt.setAttribute('class', options[k].classes);

					if(value == options[k].key)
						opt.setAttribute('selected', 'selected');

					elem.append(opt);
				}
			}
		}

		elem.dispatchEvent(new Event('blur'));
	},


	createButton: function(item, prefix) {

		let elem;
		let id      = (prefix)   ? prefix +'_'+ item.id : item.id;
		let name    = item.name || item.id;
		let type    = item.type;
		let classes = ['R4'];
		let attr    = item.attr || {};

		let attrib  = {
			id:   id,
			name: name,
			type: type
		};

		elem = document.createElement('button');

		if(item.classes) classes.push(item.classes);

		attrib.class = classes.join(' ');

		if(attr) {
			for(let k in attr) attrib[k] = attr[k];
		}

		for(let k in attrib) elem.setAttribute(k, attrib[k]);

		if(item.label) elem.innerHTML = item.label;

		return elem;
	},


	createSwitch: function(item, prefix) {

		let elem;
		let elLabel;
		let id      = (prefix) ? prefix +'_'+ item.id : item.id;
		let name    = item.name    || item.id;
		let attr    = item.attr    || {};
		let value   = item.value   || 1;
		let checked = item.checked || false;
		let label   = item.label   || '';
		let classes = [];

		let attrib  = {
			id:   id,
			name: name,
			type: 'checkbox',
			R4Type: 'switch',
			value: value
		};

		elem = document.createElement('input');

		if(item.classes) classes.push(item.classes);

		attrib.class = classes.join(' ');

		if(checked) attrib.checked = true;

		if(attr) {
			for(let k in attr) attrib[k] = attr[k];
		}

		for(let k in attrib) elem.setAttribute(k, attrib[k]);

		elLabel = document.createElement('label');
		elLabel.setAttribute('for', id);
		elLabel.innerHTML = label;

		let wrap = document.createElement('div');
		wrap.setAttribute('class', 'R4Fields switch');
		wrap.append(elem);
		wrap.append(elLabel);

		return wrap;
	},


	setValidateRules: function(elem, prop) {

		if(prop.required) {
			elem.classList.add('RequiredField');
			elem.classList.add('WithValidate');
		}
		if(prop.minSize) {
			elem.setAttribute('minSize', prop.minSize);
			elem.classList.add('WithValidate');
		}
		if(prop.maxSize) {
			elem.setAttribute('maxSize', prop.maxSize);
			elem.classList.add('WithValidate');
		}
		if(prop.exactSize) {
			elem.setAttribute('exactSize', prop.exactSize);
			elem.classList.add('WithValidate');
		}
		if(prop.regex) {
			elem.setAttribute('regexRules', prop.regex);
			elem.classList.add('WithValidate');
		}

		elem.addEventListener('keyup', function(){
			if(elem.parentNode.classList.contains('errField')) {
				Fields.validate(this);
			}
		});

		elem.addEventListener('click', function(){
			if(elem.parentNode.classList.contains('errField')) {
				Fields.validate(this);
			}
		});

		elem.addEventListener('blur', function() {
			Fields.validate(elem);
		});
	},


	validate: function(elem) {
		var arrRet = Fields.getValErrArr($(elem));
		if(arrRet.length) {
			Fields.setError(elem, '» '+ arrRet.join('<br>» '));
			return false;
		} else {
			Fields.remError(elem);
			return true;
		}
	},


	setErrFields: function(err, prefix) {
		if(err.errFields) {
			var txt, elem;

			for(var campo in err.errFields) {
				elem = document.getElementById(prefix +'_'+ campo);

				txt = '';
				err.errFields[campo].forEach(item => {
					txt += '» '+ item +'<br>';
				});

				Fields.setError(elem, txt);
			}
		}
	},


	setError: function(elem, errTxt) {
		elem.parentNode.classList.add('errField');

		let r = Pop.hint(elem, errTxt);

		Fields.listActiveErrFields[r.id] = r.fn;
	},


	remError: function(elem) {
		let id = elem.id;
		elem.parentNode.classList.remove('errField');
		elem.removeEventListener('mouseenter', Fields.listActiveErrFields[id]);
		delete Fields.listActiveErrFields[id];
	},


	remAllErrFields: function(form) {

		let wrap = (typeof form == 'object') ? form : document;

		let elem;
		wrap.querySelectorAll('.errField').forEach(item => {
			 elem = item.querySelector('input, select, textarea');
			 Fields.remError(elem);
		});
	},


	getValErrArr: function(elem) {
		Fields.remError(elem);
		var valid = true;
		var arrErrors = [];


		if(elem.visible()) {
			var val = Fields.getVal(elem);
			if(elem.classList.contains('RequiredField')) {

				if(elem.tagName.toLowerCase() == 'select') {
					if(!val.trim()) valid = false;
				} else {
					if(val == '' || val == '0000-00-00') valid = false;
				}

				if(!valid) arrErrors.push('Campo obrigatório');
			}


			if(elem.attr('minSize')) {
				if((val.length < elem.attr('minSize')) && (val.length != 0)) {
					valid = false;
					arrErrors.push('Mínimo de '+ elem.attr('minSize') +' caracteres');
				}
			}


			if(elem.attr('maxSize')) {
				if(val.length > elem.attr('maxSize')) {
					valid = false;
					arrErrors.push('Máximo de '+ elem.attr('maxSize') +' caracteres');
				}
			}


			if(elem.attr('exactSize')) {
				if(val.length != 0) {
					sizes = elem.attr('exactSize').split(',');
					valid = false;
					for(let k in sizes) {
						if(val.length == sizes[k]) {
							valid = true;
							break;
						}
					}
					if(!valid) {
						arrErrors.push('Deve ter exatamente '+ elem.attr('exactSize') +' caracteres');
					}
				}
			}


			if((elem.attr('decimal')) && (val.length != 0)) {
				let splits = elem.attr('decimal').split(',');
				let decVal = parseInt(splits[1]);
				let intVal = parseInt(splits[0])-decVal;
				let regExp = null;

				if(decVal > 0) {
					regExp = new RegExp('^(-|)([0-9]{1,'+ intVal +'})(\.([0-9]{1,'+ decVal +'})|$)$', 'gi');
				} else {
					regExp = new RegExp('^(-|)([0-9]{1,'+ intVal +'})$', 'gi');
				}

				valid = regExp.test(val);

				if(!valid) {
					arrErrors.push('Valor inválido');
				}
			}


			if((elem.attr('regexRules')) && (val.length != 0)) {
				var rules  = elem.attr('regexRules');
				var regExp = new RegExp(rules, 'gi');

				valid = regExp.test(val);
				if(!valid) {
					arrErrors.push('Conteúdo fora do padrão');
				}
			}

			switch(elem.attr('R4Type')) {
				case 'email':
					if(val) {
						if(!R4.checkMail(val)) {
							valid = false;
							arrErrors.push('Email inválido');
						}
					}
				break;

				case 'date':
				case 'datetime':
					if((val) && (val != '0000-00-00')) {
						if(!R4.checkDate(val)) {
							valid = false;
							arrErrors.push('Data inválida');
						}
					}
				break;
				case 'autocomplete':
					if((elem.val().trim() != '') && (!elem.classList.contains('AllowZero'))) {
						//~ if(LazevAc.getVal(elem) == 0) {
							//~ valid = false;
							//~ arrErrors.push('Necessário selecionar uma opção');
						//~ }
					}
				break;
				case 'cep':
					if(val) {
						if(val.length < 8) {
							valid = false;
							arrErrors.push('CEP inválido');
						}
					}
				break;
				case 'cpfcnpj':
				case 'cnpjcpf':
					if(val) {
						if(!R4.checkCPFCNPJ(val)) {
							valid = false;
							arrErrors.push('CPF/CNPJ inválido');
						}
					}
				break;

				case 'cpf':
					if(val) {
						if(!R4.checkCPF(val)) {
							valid = false;
							arrErrors.push('CPF inválido');
						}
					}
				break;

				case 'cnpj':
					if(val) {
						if(!R4.checkCNPJ(val)) {
							valid = false;
							arrErrors.push('CNPJ inválido');
						}
					}
				break;
			}
		}
		return arrErrors;
	},


	validateAndGetVal: function(fieldArr) {
		let countErr = 0;
		fieldArr.forEach(el => {
			el.dispatchEvent(new Event('blur'));
			if(el.parentNode.classList.contains('errField')) countErr++;
		});

		if(countErr) {
			Warning.show(
				R4.plural('Há '+ countErr +' erro(#) no formulário', countErr),
				'Não foi possível enviar os dados'
			);
			return false;
		}

		let ret = {};
		fieldArr.forEach(elem => {
			ret[elem.getAttribute('name')] = Fields.getVal(elem);
		});
		return ret;
	},


	validateForm: function(form) {
		return Fields.validateAndGetVal(form.querySelectorAll('input, select, textarea'));
	},


	getVal: function(elem) {
		if(typeof elem === 'undefined') {
			console.warn('Undefined field');
			return '';
		} else {
			let type = elem.getAttribute('R4Type');
			switch(type) {
				case 'switch':    return (elem.checked) ? elem.value : 0;
				case 'decimal':
				case 'decimal-':
				case 'money':
				case 'money-':    return R4.toUSNumber(elem.value);
				case 'date':      return R4.dateUnmask(elem.value, '0000-00-00');
				case 'tags':
				case 'emailtags':
				case 'phonetags': return FieldsTags.getVal(elem);
				case 'cpfcnpj':
				case 'cpf':
				case 'cnpj':
				case 'cep':
				case 'phone':     return R4.onlyNumbers(elem.value);
				default:          return elem.value;
			}
		}
	},


	getText: function(elem) {
		if(elem.tagName.toLowerCase() == 'select')
			return elem.options[elem.selectedIndex].text;

		let type = elem.getAttribute('R4Type');
		switch(type) {
			case 'tags':
			case 'emailtags':
			case 'phonetags': return FieldsTags.getText(elem);
			default: return elem.value;
		}
	},


	getArrCheckbox: groupBox => {
		let ret = [];
		groupBox.querySelectorAll('input[type=checkbox]').forEach(item => {
			if(item.checked) ret.push(item.value);
		});
		return ret;
	},


	setVal: function(elem, value, label) {
		let type = elem.getAttribute('R4Type');
		switch(type) {
			case 'switch':
				if(!value || value == '0' || value == 'false') elem.checked = false;
				else elem.checked = true;
				break;
			case 'money':
			case 'money-':
			case 'decimal':
			case 'decimal-':
				if(value == 0) elem.value = '';
				else elem.value = R4.toEUNumber(value);
				break;
			case 'cpf':
			case 'cnpj':
			case 'cpfcnpj':
				elem.value = R4.cpfcnpjMask(value);
				break;
			case 'date':
				elem.value = R4.dateMask(value);
				break;
			case 'phone':
				elem.value = R4.phoneMask(value);
				break;
			case 'cep':
				elem.value = R4.cepMask(value);
				break;
			case 'tags':
			case 'emailtags':
			case 'phonetags':
				FieldsTags.setVal(elem, value, label);
				break;
			default:
				if(typeof value === 'string' && value.indexOf('&') > -1)
					value = Fields.htmlTagsEntitiesDecode(value);

				elem.value = value;
		}
		elem.dispatchEvent(new Event('blur'));
	},


	htmlTagsEntitiesDecode: function(txt) {
		txt = txt.replaceAll('&lt;', '<');
		txt = txt.replaceAll('&gt;', '>');
		return txt;
	},


	setCalcEvents: function(elem) {

		elem.addEventListener('keypress', function(ev){

			if(ev.keyCode == 13) {
				if(elem.value.substr(0, 1) == '=') {
					elem.setAttribute('R4CtrlZ', elem.value);
					elem.value = '='+ Fields.calc(elem.value.substr(1));
				}
			}
			else if(ev.keyCode == 26 && ev.ctrlKey) {
				let ctrlz = elem.getAttribute('R4CtrlZ');
				if(ctrlz) elem.value = ctrlz;
			}
			else if(ev.keyCode == 61) {
				ev.preventDefault();
				if(elem.value.substr(0, 1) == '=') {
					elem.value = elem.value.replaceAll('=', '');
				} else {
					elem.value = '='+ elem.value.replaceAll('=', '');
				}
			}
		});

		elem.addEventListener('blur', function(){
			elem.value = elem.value.replaceAll('=', '');
		});

		return elem;
	},


	calc: function(formula) {
		let form = formula.replaceAll(',', '.');
		let result;

		try {
			result = eval(form);
		} catch (e) {
			Warning.show('Erro na fórmula', e);
			console.warn(e);
			return formula;
		}

		return R4.numberMask(result, 0, 4);
	},


	reset: function(form) {
		form.reset();
		form.querySelectorAll('input, select, textarea').forEach(
			el => el.dispatchEvent(new Event('blur'))
		);
		form.querySelectorAll('input[R4Type=password]').forEach(
			el => el.setAttribute('type', 'password')
		);
		form.querySelectorAll('input[R4Type=tags]').forEach(     el => FieldsTags.clrTag(el));
		form.querySelectorAll('input[R4Type=phonetags]').forEach(el => FieldsTags.clrTag(el));
		form.querySelectorAll('input[R4Type=emailtags]').forEach(el => FieldsTags.clrTag(el));

		setTimeout(() => Fields.remAllErrFields(form), 50);
	},


	enable: function(elem, bool) {
		if(bool || bool == undefined) {
			elem.removeAttribute('readonly');
			elem.removeAttribute('disabled');
		}
		else {
			elem.setAttribute('readonly', true);
			elem.setAttribute('disabled', true);
		}
	},


	objectize: function(elem, concatObj) {
		let r = {};

		elem.querySelectorAll('input[name]:not([disabled]), select[name]:not([disabled])').forEach(elem => {
			r[elem.getAttribute('name')] = Fields.getVal(elem);
		});

		elem.querySelectorAll('textarea[name]:not([disabled])').forEach(elem => {
			r[elem.getAttribute('name')] = Fields.getVal(elem).replace(/\r?\n|\r/g, '\r\n');
		});

		if(concatObj) {
			for(var k in concatObj) {
				r[k] = concatObj[k];
			}
		}

		return r;
	},


	getAllChecked: function(elem) {
		let list = elem.querySelectorAll('input:checked');
		if(!list) return [];
		let ret = [];
		list.forEach(elem => ret.push(elem.value));
		return ret;
	}

};