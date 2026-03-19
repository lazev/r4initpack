var FieldsTags = {

	timeoutTimer: null,

	dom: {},

	iconRemove: 'x',

	create: (elem, info) => {

		if(info.maxSel)            elem.setAttribute('maxSel',            info.maxSel    );
		if(info.onSel)             elem.setAttribute('onSel',             info.onSel     );
		if(info.onDel)             elem.setAttribute('onDel',             info.onDel     );
		if(info.onAddTag)          elem.setAttribute('onAddTag',          info.onAddTag  );
		if(info.typeahead)         elem.setAttribute('typeahead',         info.typeahead );
		if(info.source)            elem.setAttribute('source',            info.source    );
		if(info.minLength)         elem.setAttribute('minLength',         info.minLength );
		if(info.allowFreeText)     elem.setAttribute('allowFreeText',     true           );
		if(info.hideInputOnMaxSel) elem.setAttribute('hideInputOnMaxSel', true           );
		if(info.autoSelectFirst)   elem.setAttribute('autoSelectFirst',   true           );

		elem.addEventListener('keydown', ev => {

			if(info.maxSel) {
				if(ev.keyCode != 8 && ev.keyCode != 9) {
					let vals = FieldsTags.getVal(elem, true);
					if(vals.length >= info.maxSel) {
						ev.preventDefault();
					}
				}
			}

			if(ev.keyCode == 108 || ev.keyCode == 188 || ev.keyCode == 13) {
				ev.preventDefault();
				if(!info.typeahead) {
					FieldsTags.addTag(elem, elem.value);
				}
			}

			else if(ev.keyCode == 8) {
				if(elem.value == '') {
					FieldsTags.remTag(
						elem,
						elem.parentNode.querySelector('.tagList').querySelector('.tagItem:last-child')
					);
					FieldsTags.onDelTag(elem);
				}
			}
		});

		elem.addEventListener('blur', function(event){
			if(!info.typeahead) {
				FieldsTags.addTag(elem, elem.value);
			}
		});

		elem.addEventListener('paste', function(event){
			let paste = event.clipboardData.getData('text');

			if(paste.indexOf(',') > -1) {
				setTimeout(() => {
					FieldsTags.appendVal(elem, elem.value);
				}, 100);
			}
		});

		if(info.typeahead) {
			FieldsTags.setDomTypeAheadEvent(elem, info);
		}

		return elem;
	},


	withContent: elem => {
		if(!elem.parentNode.querySelector('.tagList').querySelectorAll('.tagItem').length) {
			elem.parentNode.classList.remove('withContent');
		} else {
			elem.parentNode.classList.add('withContent');
		}
		elem.trigger('blur');
	},


	addTag: (elem, val, label) => {

		val = val.toString().trim();

		if(!val) return;

		let maxSel = elem.getAttribute('maxSel');

		let vals = FieldsTags.getVal(elem, true);

		if(maxSel && vals.length >= maxSel) {
			if(maxSel == 1) {
				FieldsTags.clrTag(elem);
				vals = FieldsTags.getVal(elem, true);
			} else {
				elem.value = '';
				return;
			}
		}

		let hideInputOnMaxSel = elem.getAttribute('hideInputOnMaxSel');

		let onAddTag = elem.getAttribute('onAddTag');

		for(let k in vals) {
			if(vals[k] == val) {
				k++;
				Effects.blink(elem.parentNode.querySelector('.tagList').querySelector(':nth-child('+ k +')'));
				elem.value = '';
				return;
			}
		}

		let el = document.createElement('div');
		el.classList.add('tagItem');
		el.setAttribute('value', val);

		if(elem.getAttribute('R4Type') == 'emailtags') {
			if(!R4.checkMail(val)) {
				el.classList.add('danger');
			}
		}

		let txt = (label) ? label : val;
		el.setAttribute('text', txt);

		let rem = document.createElement('span');
		rem.innerHTML = FieldsTags.iconRemove;
		rem.classList.add('closer');
		rem.addEventListener('click', ev => {
			FieldsTags.remTag(elem, ev.target.parentNode);
			FieldsTags.onDelTag(elem);
		});

		el.append(rem);
		el.append(document.createTextNode(txt));

		elem.parentNode.querySelector('.tagList').append(el);
		elem.value = '';

		let fn = R4.resolveFunc(onAddTag);
		if(fn) fn(val, label, el);

		if(hideInputOnMaxSel) {
			vals = FieldsTags.getVal(elem, true);
			if(maxSel && vals.length >= maxSel) {
				elem.classList.add('hidden');
			}
		}

		FieldsTags.withContent(elem);
	},


	clrTag: elem => {
		elem.parentNode.querySelector('.tagList').innerHTML = '';
		elem.classList.remove('hidden');
		FieldsTags.withContent(elem);
	},


	remTag: (elem, target) => {
		if(target) target.remove();
		elem.classList.remove('hidden');
		FieldsTags.withContent(elem);
	},


	onDelTag: elem => {

		let onDel = elem.getAttribute('onDel');

		let fn = R4.resolveFunc(onDel);
		if(fn) fn(FieldsTags.getVal(elem));
	},


	setVal: (elem, val, label) => {
		FieldsTags.clrTag(elem);
		FieldsTags.appendVal(elem, val, label);
	},


	appendVal: (elem, val, label) => {

		elem.value = '';

		if(val && val != '0') {

			val = val.toString();

			let arr = (val.indexOf(',') > -1) ? val.split(',') : [val];

			arr.forEach(item => {
				if(elem.getAttribute('R4Type') == 'phonetags') {
					FieldsTags.addTag(elem, R4.phoneMask(item));
				}
				else {
					FieldsTags.addTag(elem, item, label);
				}
			});
		}
	},


	getVal: (elem, retArr) => {
		let ret = [];
		elem.parentNode.querySelector('.tagList').querySelectorAll('.tagItem').forEach(el => {
			ret.push(el.getAttribute('value'));
		});

		if(elem.getAttribute('R4Type') == 'phonetags') {
			ret.forEach(function(item, key){
				ret[key] = R4.onlyNumbers(item);
			});
		}

		if(retArr) return ret;
		return ret.join(',');
	},


	getText: (elem, retArr) => {

		let ret = [];
		elem.parentNode.querySelector('.tagList').querySelectorAll('.tagItem').forEach(el => {
			ret.push(el.getAttribute('text'));
		});
		if(retArr) return ret;
		return ret.join(',');

	},


	//TYPEAHEAD ADDON

	setDomTypeAheadEvent: (elem, info) => {
		elem.addEventListener('click', function(ev) {
			let listElem = document.getElementById(this.id +'_typeAheadList');
			if(!listElem) FieldsTags.typeAheadShowList(this);
			else FieldsTags.typeAheadDestroyList(this);
		});

		elem.addEventListener('keyup', function(ev) {
			let listElem = document.getElementById(this.id +'_typeAheadList');
			if(listElem) {
				if(ev.keyCode == 38)      FieldsTags.typeAheadMarkItem(this, -1);
				else if(ev.keyCode == 40) FieldsTags.typeAheadMarkItem(this,  1);
				else if(ev.keyCode == 13) {
					if(FieldsTags.typeAheadSelItem(this)) {
						FieldsTags.typeAheadValidValue(this);
					}
				}
				else FieldsTags.typeAheadShowList(this);
			} else FieldsTags.typeAheadShowList(this);
		});

		elem.addEventListener('blur', function(ev) {

			FieldsTags.typeAheadValidValue(this);

			let listElem = document.getElementById(this.id +'_typeAheadList');

			if(!listElem || !listElem.classList.contains('R4MouseOver')) {
				FieldsTags.typeAheadDestroyList(this);
			}
		});
	},


	typeAheadShowList: elem => {
		let list, listItens;

		let listElem = document.getElementById(elem.id +'_typeAheadList');
		if(!listElem) listElem = FieldsTags.typeAheadCreateList(elem);

		let value     = elem.value;
		let typeahead = elem.getAttribute('typeahead');
		let source    = elem.getAttribute('source');
		let minLength = elem.getAttribute('minLength');

		if(parseInt(minLength) > 0) {
			if(value.length < minLength) {
				FieldsTags.typeAheadDestroyList(elem);
				return;
			}
		}

		if(typeahead == 'json') {

			if(typeof source == 'string')
				list = FieldsTags.typeAheadFilterList(R4.resolveFunc(source) || window[source], value);

			else if(typeof source == 'object')
				list = FieldsTags.typeAheadFilterList(source, value);

			listItens = FieldsTags.typeAheadFormatList(elem, list);

			listElem.innerHTML = '';
			listElem.append(listItens);
			// A ideia é permitir que os eventos como mouseenter só rodem
			// depois da lista criada em tela. Sem isso o mouseenter roda
			// no mesmo instante que a lista recebe os itens.
			setTimeout(()=>{ elem.selItemEventsLocked = false; }, 50);
		}

		else if(typeahead == 'function') {
			let fn = R4.resolveFunc(source);
			if(typeof fn === 'function') {

				clearTimeout(FieldsTags.timeoutTimer);
				FieldsTags.timeoutTimer = setTimeout(function(){

					fn(value)

					.then(list => {
						listItens = FieldsTags.typeAheadFormatList(elem, list);

						listElem.innerHTML = '';
						listElem.append(listItens);
						// A ideia é permitir que os eventos como mouseenter só rodem
						// depois da lista criada em tela. Sem isso o mouseenter roda
						// no mesmo instante que a lista recebe os itens.
						setTimeout(()=>{ elem.selItemEventsLocked = false; }, 50);
					});

				}, 500);
			}
		}
	},


	typeAheadValidValue: elem => {
		if(elem.value) {
			let allowFreeText = elem.getAttribute('allowFreeText');
			if(allowFreeText) {
				FieldsTags.addTag(elem, elem.value);
			} else {
				elem.value = '';
			}
		}
	},


	typeAheadMarkItem: (elem, direction) => {

		let listElem = document.getElementById(elem.id +'_typeAheadList');

		let marked = listElem.querySelector('.marked');

		if(!marked) {
			let listItem = listElem.querySelector('li:first-child');
			if(listItem) listItem.classList.add('marked');
		}
		else {
			let next;
			if(direction > 0)      next = marked.nextElementSibling;
			else if(direction < 0) next = marked.previousElementSibling;

			if(!next) return;

			listElem.querySelectorAll('ul > li').forEach(item => {
				item.classList.remove('marked');
			});

			next.classList.add('marked');
		}
	},


	typeAheadFilterList: (source, value) => {

		value = value.toLowerCase();

		let ret = source.filter((item) => {
			if(item.label) {
				return (item.label.toLowerCase().indexOf(value) > -1);
			}
			else if(item.value) {
				return (item.value.toLowerCase().indexOf(value) > -1);
			}
		});

		return ret;
	},


	typeAheadFormatList: (elem, list) => {

		let ul = document.createElement('ul');

		if(!list.length) return ul;

		list.forEach(function(item) {
			ul.append(FieldsTags.typeAheadFormatListItem(item));
		});

		elem.selItemEventsLocked = true;

		ul.querySelectorAll('li').forEach(li => {

			li.addEventListener('mouseenter', ev => {
				if(!elem.selItemEventsLocked) {
					ev.target.parentNode.querySelectorAll('li').forEach(item => {
						item.classList.remove('marked');
					});
					ev.target.classList.add('marked');
				}
			});

			li.addEventListener('click', function(ev) {
				if(!elem.selItemEventsLocked) {
					FieldsTags.typeAheadSelItem(elem, ev.target);
					elem.focus();
				}
			});
		});

		if(elem.getAttribute('autoSelectFirst')) {
			let item = ul.querySelector('li');
			item.classList.add('marked');
			elem.focus();
		}

		return ul;
	},


	typeAheadFormatListItem: item => {
		let extra;

		let label = document.createElement('div');
		label.classList.add('itemText');
		label.innerHTML = (item.label) ? item.label : item.value;

		if(item.extra) {
			extra = document.createElement('div');
			extra.classList.add('itemExtra');
			extra.innerHTML = item.extra;
		}

		let li = document.createElement('li');
		li.setAttribute('value', item.key);

		li.append(label);
		if(extra) li.append(extra);

		return li;
	},


	typeAheadSelItem: (elem, li) => {

		let onSel = elem.getAttribute('onSel');

		let listElem = document.getElementById(elem.id +'_typeAheadList');

		let marked = (li) ? li : listElem.querySelector('.marked');

		if(marked) {

			let val = marked.getAttribute('value');
			let lab = marked.querySelector('div').innerHTML;

			let fn = R4.resolveFunc(onSel);
			if(fn) fn(val, lab);

			FieldsTags.addTag(elem, val, lab);
			FieldsTags.typeAheadDestroyList(elem);
		}
		else return false;
	},


	typeAheadCreateList: elem => {

		let typeAheadList = document.createElement('div');

		typeAheadList.setAttribute('id', elem.id +'_typeAheadList');
		typeAheadList.classList.add('R4TypeAheadList');

		let destPos = elem.parentNode.getBoundingClientRect();

		let topLeft = {
			top:  destPos.top,// + window.pageYOffset,
			left: destPos.left// + window.pageXOffset
		};

		typeAheadList.style.top  = topLeft.top  + 'px';
		typeAheadList.style.left = topLeft.left + 'px';

		typeAheadList.addEventListener('mouseenter', function(ev) {
			this.classList.add('R4MouseOver');
		});

		typeAheadList.addEventListener('mouseleave', function(ev) {
			this.classList.remove('R4MouseOver');
			if(document.activeElement != elem) FieldsTags.typeAheadDestroyList(elem);
		});

		document.querySelector('body').append(typeAheadList);

		return typeAheadList;
	},


	typeAheadDestroyList: elem => {
		let listElem = document.getElementById(elem.id +'_typeAheadList');

		if(listElem) listElem.remove();
	}

};