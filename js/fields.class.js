var Fields = {

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
				.catch(err => {
					reject('Erro ao abrir o JSON do fields');
				});

		});

	},


	create: function(jsonFields, prefix) {

		return new Promise((resolve, reject) => {

			var item, elem, rcpt, label;

			if(!prefix) prefix = '';

			for(let k in jsonFields) {

				elem = null;
				item = jsonFields[k];

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

				rcpt.innerHTML = '';

				rcpt.append(elem);
			}

			resolve(true);
		});
	},


	createInput: function(item, prefix) {

		let elem, type, label, passEye, wrapClass, tagList;

		let id   = (prefix)   ? prefix +'_'+ item.id : item.id;
		let name = item.name || item.id;

		item.id = id;

		let attrib = {
			id: id,
			name: name,
			//required: 'required',
			autocomplete: 'off',
			R4Type: item.type
		};

		if(item.type == 'textarea') {
			elem = document.createElement('textarea');

		}
		else {
			elem = document.createElement('input');

			switch(item.type) {
				case 'tags':
					wrapClass = 'tags';
					tagList = document.createElement('span');
					tagList.classList.add('tagList');

					elem = FieldsTags.create(elem, item);

					break;

				case 'password':
					type = item.type;
					passEye = document.createElement('span');
					passEye.setAttribute('class', 'passEye');
					passEye.innerHTML = '&#128065;';
					passEye.addEventListener('click', function(e){
						elem.setAttribute(
							'type',
							elem.getAttribute('type') === 'password' ? 'text' : 'password'
						);
					});
					break;

				case 'integer':
				case 'integer-':
					type = 'number';

					if(item.type == 'integer') {
						if(item.min < 0) item.min = 0;
					}
					break;

				case 'money':
				case 'decimal':
					type = 'text';
					break;

				default:
					type = 'text';
			}
		}

		if(type)             attrib.type        = type;
		if(item.value)       attrib.value       = item.value;
		if(item.min)         attrib.min         = item.min;
		if(item.max)         attrib.max         = item.max;
		if(item.step)        attrib.step        = item.step;
		if(item.placeholder) attrib.placeholder = item.placeholder;
		if(item.classes)     attrib.classes     = item.classes;

		if(item.attr) {
			for(let k in item.attr) attrib[k] = item.attr[k];
		}

		for(let k in attrib) elem.setAttribute(k, attrib[k]);

		if(item.label) {
			label = document.createElement('label');
			label.setAttribute('for', attrib.id);
			label.innerHTML = item.label;
		}

		let bar = document.createElement('div');
		bar.setAttribute('class', 'bar');

		let wrap = document.createElement('div');
		wrap.setAttribute('class', 'R4Fields');

		if(tagList) wrap.append(tagList);

		wrap.append(elem);

		if(passEye) wrap.append(passEye);

		wrap.append(bar);
		if(label) wrap.append(label);

		if(wrapClass) {
			wrap.classList.add(wrapClass);
		}

		if(attrib.value) {
			wrap.classList.add('withContent');
		}

		if(item.type == 'tags') {
			let typeAheadList = document.createElement('div');
			typeAheadList.classList.add('typeAheadList');
			wrap.append(typeAheadList);
		} else {
			elem.addEventListener('blur', function(event){
				if(event.target.value) {
					wrap.classList.add('withContent');
				} else {
					wrap.classList.remove('withContent');
				}
			});
		}

		return wrap;
	},


	createSelect: function(item, prefix) {

		let elem, label;

		let id   = (prefix)   ? prefix +'_'+ item.id : item.id;
		let name = item.name || item.id;

		let withContent = false;

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

		if(item.options) {

			if(typeof item.options === 'string') {
				if(typeof eval(item.options) === 'object') {
					item.options = eval(item.options);
				}
			}

			for(let k in item.options) {
				if(typeof item.options[k] == 'string') {
					let opt = document.createElement('option');

					opt.setAttribute('value', k);

					if(item.value == k) {
						opt.setAttribute('selected', 'selected');
						withContent = true;
					}

					opt.innerHTML = item.options[k];

					elem.append(opt);
				}
			}
		}

		if(item.label) {
			label = document.createElement('label');
			label.innerHTML = item.label;
		}

		let wrap = document.createElement('div');
		wrap.setAttribute('class', 'R4Fields');
		wrap.append(elem);
		wrap.append(label);
		if(withContent) {
			wrap.classList.add('withContent');
		}

		elem.addEventListener('blur', function(event){
			if(event.target.value && event.target.value != 0) {
				wrap.classList.add('withContent');
			} else {
				wrap.classList.remove('withContent');
			}
		});

		return wrap;
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
		let label   = item.label   ?? 'abc';
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


	getVal: function(elem) {
		if(typeof elem === 'undefined') {
			console.warn('Undefined field');
			return '';
		} else {
			let type = elem.getAttribute('R4Type');
			switch(type) {
				case 'switch': return (elem.checked) ? elem.value : 0;
				case 'money':  return R4.toUSNumber(elem.value);
				case 'tags':   return FieldsTags.getVal(elem);
				default:       return elem.value;
			}
		}
	},


	setVal: function(elem, value) {
		let type = elem.getAttribute('R4Type');
		switch(type) {
			case 'switch':
				if(!value || value == '0' || value == 'false') elem.checked = false;
				else elem.checked = true;
				break;
			case 'money':
				elem.value = R4.toEUNumber(value);
				break;
			case 'tags':
				FieldsTags.setVal(elem, value);
				break;
			default:
				elem.value = value;
		}
		elem.dispatchEvent(new Event('blur'));
	},


	reset: function(elem) {
		elem.reset();
		elem.querySelectorAll('input').forEach(   elem => { elem.dispatchEvent(new Event('blur')); });
		elem.querySelectorAll('select').forEach(  elem => { elem.dispatchEvent(new Event('blur')); });
		elem.querySelectorAll('textarea').forEach(elem => { elem.dispatchEvent(new Event('blur')); });
		elem.querySelectorAll('input[R4Type=tags]').forEach(elem => { FieldsTags.clrTag(elem); });
	}
};