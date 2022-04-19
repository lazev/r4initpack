FieldsTags = {

	timeoutTimer: null,

	dom: {},

	create: (elem, info) => {

		if(info.maxSel) {
			elem.setAttribute('maxSel', info.maxSel);
		}

		if(info.hideInputOnMaxSel) {
			elem.setAttribute('hideInputOnMaxSel', true);
		}

		if(info.onSel)    elem.setAttribute('onSel',    info.onSel   );
		if(info.onAddTag) elem.setAttribute('onAddTag', info.onAddTag);

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
				if(info.typeahead) {
					FieldsTags.typeAheadSelItem(elem);
				} else {
					FieldsTags.addTag(elem, elem.value);
				}
			}

			else if(ev.keyCode == 8) {
				if(elem.value == '') {
					FieldsTags.remTag(
						elem,
						elem.parentNode.querySelector('.tagList').querySelector('.tagItem:last-child')
					);
				}
			}

			else if(ev.keyCode == 38) {
				FieldsTags.typeAheadMarkItem(ev.target, -1);
			}

			else if(ev.keyCode == 40) {
				FieldsTags.typeAheadMarkItem(ev.target, 1);
			}
		});

		elem.addEventListener('blur', function(event){
			setTimeout(() => {
				//Small delay to run typeahead elem click before blur
				FieldsTags.addTag(elem, elem.value);
				FieldsTags.withContent(event.target);
			}, 100);
		});

		elem.addEventListener('paste', function(event){
			let paste = (event.clipboardData || window.clipboardData).getData('text');
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
	},


	addTag: (elem, val, label) => {

		val = val.toString().trim();

		if(!val) return;

		let maxSel = elem.getAttribute('maxSel');

		let hideInputOnMaxSel = elem.getAttribute('hideInputOnMaxSel');

		let onAddTag = elem.getAttribute('onAddTag');

		let vals = FieldsTags.getVal(elem, true);

		if(maxSel && vals.length >= maxSel) {
			elem.value = '';
			return;
		}

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
		el.classList.add('bgPrimary');
		el.classList.add('white');
		el.classList.add('corner');
		el.setAttribute('value', val);

		let txt = (label) ? label : val;
		el.setAttribute('text', txt);

		let rem = document.createElement('span');
		rem.innerHTML = 'x';
		rem.classList.add('closer');
		rem.addEventListener('click', ev => {
			FieldsTags.remTag(elem, ev.target.parentNode);
		});

		el.appendChild(rem);
		el.appendChild(document.createTextNode(txt));

		elem.parentNode.querySelector('.tagList').appendChild(el);
		elem.value = '';

		if(typeof eval(onAddTag) === 'function') {
			eval(onAddTag +'("'+ val +'", "'+ label +'", el)');
		}

		if(hideInputOnMaxSel) {
			vals = FieldsTags.getVal(elem, true);
			if(maxSel && vals.length >= maxSel) {
				elem.classList.add('hidden');
			}
		}
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


	setVal: (elem, val, label) => {
		FieldsTags.clrTag(elem);
		FieldsTags.appendVal(elem, val, label);
	},


	appendVal: (elem, val, label) => {

		elem.value = '';

		if(val) {

			val = val.toString();

			let arr = (val.indexOf(',') > -1) ? val.split(',') : [val];

			arr.forEach(item => {
				if(elem.getAttribute('R4Type') == 'phonetags') {
					FieldsTags.addTag(elem, R4.phoneMask(item));
				} else {
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
		FieldsTags.dom[info.id] = ev => {
			let list, listElem;

			let destiny = ev.target.parentNode.querySelector('.typeAheadList');

			let value = ev.target.value;

			if(parseInt(info.minLength) > 0) {
				if(value.length < info.minLength) {
					ev.target.parentNode.querySelector('.typeAheadList').innerHTML = '';
					return;
				}
			}

			if(info.typeahead == 'json') {

				if(typeof info.source == 'string') {
					list = FieldsTags.typeAheadFilterList(eval(info.source), value);
				}

				else if(typeof info.source == 'object') {
					list = FieldsTags.typeAheadFilterList(info.source, value);
				}

				listElem = FieldsTags.typeAheadFormatList(elem, list);

				destiny.innerHTML = '';
				destiny.appendChild(listElem);
			}

			else if(info.typeahead == 'function') {
				if(typeof eval(info.source) === 'function') {

					clearTimeout(FieldsTags.timeoutTimer);
					FieldsTags.timeoutTimer = setTimeout(function(){

						eval(info.source +'("'+ value +'")' )

						.then(list => {
							listElem = FieldsTags.typeAheadFormatList(elem, list);

							destiny.innerHTML = '';
							destiny.append(listElem);
						});

					}, 300);
				}
			}
		};

		elem.addEventListener('keyup', ev => {
			if((ev.keyCode != 38) && (ev.keyCode != 40)) { //arrow up (38) and down (40)
				FieldsTags.dom[ev.target.id](ev);
			}
		});

		elem.addEventListener('blur', ev => {
			setTimeout(() => {
				ev.target.parentNode.querySelector('.typeAheadList').innerHTML = '';
			}, 100);
		});
	},


	typeAheadMarkItem: (elem, direction) => {
		let listElem = elem.parentNode.querySelector('.typeAheadList');
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
			return (item.label.toLowerCase().indexOf(value) > -1);
		});

		return ret;
	},


	typeAheadFormatList: (elem, list) => {
		let ul = document.createElement('ul');

		list.forEach(function(item){
			ul.appendChild(FieldsTags.typeAheadFormatListItem(item));
		});

		ul.querySelectorAll('li').forEach(li => {

			li.addEventListener('mouseenter', ev => {
				ev.target.parentNode.querySelectorAll('li').forEach(item => {
					item.classList.remove('marked');
				});
				ev.target.classList.add('marked');
			});

			li.addEventListener('click', function(ev) {
				FieldsTags.typeAheadSelItem(elem);
				elem.focus();
			});
		});

		return ul;
	},


	typeAheadFormatListItem: item => {
		let extra;
		let label = document.createElement('div');
		label.classList.add('itemText');
		label.innerHTML = item.label;

		if(item.extra) {
			extra = document.createElement('div');
			extra.classList.add('itemExtra');
			extra.innerHTML = item.extra;
		}

		let li = document.createElement('li');
		li.setAttribute('value', item.key);

		li.appendChild(label);
		if(extra) {
			li.appendChild(extra);
		}

		return li;
	},


	typeAheadSelItem: elem => {

		let onSel = elem.getAttribute('onSel');

		let listElem = elem.parentNode.querySelector('.typeAheadList');

		let marked = listElem.querySelector('.marked');

		if(marked) {

			let val = marked.getAttribute('value');
			let label = marked.querySelector('div').innerHTML;

			if(typeof eval(onSel) === 'function') {
				eval(onSel +'("'+ val +'", "'+ label +'")');
			}

			FieldsTags.addTag(elem, val, label);

			elem.parentNode.querySelector('.typeAheadList').innerHTML = '';
		}
	}

};