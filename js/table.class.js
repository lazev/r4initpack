var Table = {

	dom: {},

	body: [],
	foot: [],

	create: function(opts){

		if(!opts) opts = {};

		let idDestiny   = opts.idDestiny;

		Table.dom[idDestiny] = {
			head:         opts.arrHead,
			withCheck:    opts.withCheck,
			onLineClick:  opts.onLineClick,
			onOrderBy:    opts.onOrderBy,
			onRegPerPage: opts.onRegPerPage,
			onPagination: opts.onPagination
		};

		let arrInfo = opts.arrInfo;
		let arrBody = opts.arrBody;
		let arrFoot = opts.arrFoot;
		let classes = ['R4'];
		if(opts.classes) classes.push(opts.classes);

		let head    = Table.createHead(opts.arrHead, idDestiny);

		let destiny = document.getElementById(idDestiny);
		let table   = document.createElement('table');
		let tfoot   = document.createElement('tfoot');
		let tbody   = document.createElement('tbody');

		table.setAttribute('class', classes.join(' '));

		if(head) table.appendChild(head);

		table.appendChild(tbody);
		table.appendChild(tfoot);

		destiny.innerHTML = '';
		destiny.appendChild(table);

		if(arrInfo) Table.setInfo(destiny, arrInfo);

		Table.updateContent(destiny, arrBody, arrFoot);

		if(opts.onPagination) {
			let aftertbl = document.createElement('div');
			aftertbl.setAttribute('class', 'row clearfix');

			let pgntn = Table.createPagination(destiny);
			if(pgntn) aftertbl.appendChild(pgntn);

			let rowspg = Table.createRegPerPage(destiny);
			if(rowspg) aftertbl.appendChild(rowspg);

			destiny.appendChild(aftertbl);
		}
	},


	setInfo: function(elem, params, clicked) {

		let destiny = elem[0] || elem;

		let info = Table.getInfo(destiny);

		if(params.orderBy)     info.orderBy     = params.orderBy.trim();
		if(params.currentPage) info.currentPage = params.currentPage;
		if(params.regPerPage)  info.regPerPage  = params.regPerPage;
		if(params.totalReg)    info.totalReg    = params.totalReg;

		destiny.setAttribute('orderBy',     info.orderBy     );
		destiny.setAttribute('currentPage', info.currentPage );
		destiny.setAttribute('regPerPage',  info.regPerPage  );
		destiny.setAttribute('totalReg',    info.totalReg    );

		Table.updateOrderBy(destiny,    info.orderBy, clicked);
		Table.updatePagination(destiny, info.regPerPage, info.totalReg, info.currentPage);
		Table.updateRegPerPage(destiny, info.regPerPage);
	},


	getInfo: function(elem) {
		let arr = [];
		let destiny = elem[0] || elem;

		arr.orderBy     = destiny.getAttribute('orderBy')     || '';
		arr.currentPage = destiny.getAttribute('currentPage') || 1;
		arr.regPerPage  = destiny.getAttribute('regPerPage')  || 15;
		arr.totalReg    = destiny.getAttribute('totalReg')    || 0;

		return arr;
	},


	createHead: function(head, idDestiny) {

		if(!head.length) return false;

		let thead = document.createElement('thead');
		let tr    = document.createElement('tr');
		let th;
		let span;

		head.forEach(function(cell, position){
			span = document.createElement('span');
			span.innerHTML = ' '+ cell.label;

			th = document.createElement('th');
			th.appendChild(span);

			if((position == 0) && (Table.dom[idDestiny].withCheck)) {
				let chkelem = document.createElement('input');
				chkelem.setAttribute('type', 'checkbox');
				chkelem.value = 'all';
				chkelem.addEventListener('click', ev => {
					chkelem.closest('table').querySelector('tbody').querySelectorAll('input[type=checkbox]').forEach(elem => {
						elem.checked = chkelem.checked;
					});
				});
				th.prepend(chkelem);
			}

			if(cell.type == 'decimal') {
				th.classList.add('right');
			}

			if(cell.orderBy) {
				span.setAttribute('orderBy', cell.orderBy);
				span.addEventListener('click', function(event) {
					if(typeof Table.dom[idDestiny].onOrderBy === 'function') {

						let direction = '';

						let arrow = this.querySelector('.R4OrderArrow');

						if(arrow) direction = arrow.getAttribute('direction') || '';

						let orderBy = this.getAttribute('orderBy') +' '+ direction;

						let tblElem = document.getElementById(idDestiny);

						Table.setInfo(tblElem, { orderBy: orderBy }, true );

						Table.dom[idDestiny].onOrderBy(this.getAttribute('orderBy') +' '+ direction);
					}
				});
			}

			tr.appendChild(th);
		});

		thead.appendChild(tr);
		return thead;
	},


	createBody: function(body, idDestiny) {
		let tr;
		let tbody = document.createElement('tbody');

		if(!body) return tbody;

		if(!body.length) return tbody;

		body.forEach(function(line){
			tr = Table.createLine(line, idDestiny);
			tbody.appendChild(tr);
		});

		return tbody;
	},


	createLine: function(line, idDestiny, footLine) {

		let tr, td;

		tr = document.createElement('tr');
		tr.setAttribute('value', line.value);

		if(typeof Table.dom[idDestiny].onLineClick === 'function') {
			tr.classList.add('clickable');
			tr.addEventListener('click', (event, elem) => {
				if(!event.target.classList.contains('nonClickCol')) {
					Table.dom[idDestiny].onLineClick(
						event.target.parentNode.getAttribute('value'),
						event.target.parentNode
					);
				}
			});
		}

		line.cells.forEach(function(value, position){

			td = document.createElement('td');

			if(Table.dom[idDestiny].head[position].type == 'decimal') {
				value = $().numberMask(value);
				td.classList.add('right');
			}
			else if(Table.dom[idDestiny].head[position].type == 'date') {
				value = $().dateMask(value);
				td.classList.add('right');
			}

			if((!footLine) && (position == 0) && (Table.dom[idDestiny].withCheck)) {
				let chkelem = document.createElement('input');
				chkelem.setAttribute('type', 'checkbox');
				chkelem.value = value;

				let labelem = document.createElement('label');
				labelem.innerHTML = ' '+ value;
				labelem.prepend(chkelem);
				td.appendChild(labelem);
			}
			else {
				td.innerHTML = ' '+ value;
			}

			if(line.classes) {
				if(line.classes[position]) td.classList.add(line.classes[position]);
			}

			tr.appendChild(td);
		});

		return tr;
	},


	updateContent: function(elem, body, foot) {
		Table.clearBody(elem);
		Table.clearFoot(elem);
		Table.appendBody(elem, body);
		Table.appendFoot(elem, foot);
	},


	clearBody: function(elem) {
		let destiny = elem[0] || elem;
		let tbody = destiny.querySelector('table > tbody');
		if(!tbody) return false;
		tbody.innerHTML = '';
	},


	clearFoot: function(elem) {
		let destiny = elem[0] || elem;
		let tfoot = destiny.querySelector('table > tfoot');
		if(!tfoot) return false;
		tfoot.innerHTML = '';
	},


	appendBody: function(elem, body) {

		if(!body) return false;

		let tr;
		let destiny = elem[0] || elem;
		let idDestiny = destiny.id;
		let tbody = destiny.querySelector('table > tbody');

		if(!tbody) return false;

		body.forEach(function(line){
			tr = Table.createLine(line, idDestiny);
			tbody.appendChild(tr);
		});

		Effects.highlight(tbody);

		Table.enableShiftCheck(idDestiny);
	},


	enableShiftCheck: function(idDestiny) {
		var shiftCheckFirstSel;
		let destiny = document.getElementById(idDestiny);
		destiny.querySelectorAll('input[type=checkbox]').forEach(function(elem){
			elem.addEventListener('click', function(ev) {
				destiny.querySelectorAll('input[type=checkbox]').forEach(function(item, posSel) {
					if(item == ev.target) {
						if(ev.shiftKey) {
							if(shiftCheckFirstSel == posSel) return;
							var iniElem = shiftCheckFirstSel;
							var endElem = posSel;
							if(posSel <= shiftCheckFirstSel) {
								iniElem = posSel;
								endElem = shiftCheckFirstSel;
							}
							for(var ii=iniElem; ii<endElem; ii++) {
								document.querySelectorAll('input[type=checkbox]')[ii].checked = ev.target.checked;
							}
						}
						shiftCheckFirstSel = posSel;
					}
				});
			});
		});
	},


	appendFoot: function(elem, foot) {

		if(!foot) return false;

		let tr;
		let destiny = elem[0] || elem;
		let idDestiny = destiny.id;
		let tfoot = destiny.querySelector('table > tfoot');

		if(!tfoot) return false;

		foot.forEach(function(line){
			tr = Table.createLine(line, idDestiny, true);
			tfoot.appendChild(tr);
		});
		Effects.highlight(tfoot);
	},


	updateOrderBy: function(table, orderBy, clicked){

		if(!orderBy) return;

		let todie, icon, asc;

		if(orderBy.substr(-5) == ' desc') {
			icon    = '&#8593;';
			asc     = '';
			orderBy = orderBy.substr(0, orderBy.length-5);
		} else {
			icon    = '&#8595;';
			asc     = 'desc';
		}

		if(clicked) {
			icon = '<span class="spinning">&#8597;</span>';
		}

		let cleaner = table.querySelectorAll('thead > tr > th');

		Array.prototype.forEach.call(cleaner, function(item){
			todie = item.querySelector('span.R4OrderArrow');
			if(todie) todie.remove();
		});

		let th = table.querySelector('[orderBy="'+ orderBy +'"]');

		if(th) {
			let orderer = document.createElement('span');
			orderer.classList.add('R4OrderArrow');
			orderer.setAttribute('direction', asc);
			orderer.innerHTML = icon;

			th.appendChild(orderer);
		}
	},


	createPagination: function(destiny) {

		let first = document.createElement('div');
		let prev  = document.createElement('div');
		let pgntn = document.createElement('div');
		let next  = document.createElement('div');
		let last  = document.createElement('div');

		pgntn.setAttribute('class', 'col-4   onRight R4TablePgntn'     );
		first.setAttribute('class', 'col-xs-3 center R4TablePageFirst' );
		prev.setAttribute('class',  'col-xs-3 center R4TablePagePrev'  );
		next.setAttribute('class',  'col-xs-3 center R4TablePageNext'  );
		last.setAttribute('class',  'col-xs-3 center R4TablePageLast'  );

		first.innerHTML = '&#x219E';
		prev.innerHTML  = '&#x21BC';
		next.innerHTML  = '&#x21C0';
		last.innerHTML  = '&#x21A0';

		pgntn.appendChild(first);
		pgntn.appendChild(prev);
		pgntn.appendChild(next);
		pgntn.appendChild(last);

		return pgntn;
	},


	createPgntnBtn: function(numPage, icon, colorClass, disabled) {
		let btn = document.createElement('button');
		btn.setAttribute('class',  'R4 bgWhite '+ colorClass +' ');
		btn.setAttribute('numPage', numPage);
		if(disabled) btn.setAttribute('disabled', 'true');
		btn.innerHTML = icon;
		return btn;
	},


	updatePagination: function(destiny, regPerPage, totalReg, currentPage){

		regPerPage  = parseInt(regPerPage);
		totalReg    = parseInt(totalReg);
		currentPage = parseInt(currentPage);

		let lastreg = (currentPage) * regPerPage;
		let lastpg  = Math.ceil(totalReg/regPerPage)-1;

		let pgntn = destiny.querySelector('.R4TablePgntn');
		if(!pgntn) return;

		let idDestiny = destiny.id;

		let hasPgs = false;

		let lnkFirst, lnkPrev, lnkNext, lnkLast;

		if(currentPage <= 1) {
			lnkFirst = Table.createPgntnBtn(0, '&#x219E', 'light', true);
			lnkPrev  = Table.createPgntnBtn(0, '&#x21BC', 'light', true);
		} else {
			lnkFirst = Table.createPgntnBtn(0,             '&#x219E', 'primary', false);
			lnkPrev  = Table.createPgntnBtn(currentPage-1, '&#x21BC', 'primary', false);
			hasPgs = true;
		}

		if(lastreg >= totalReg) {
			lnkNext = Table.createPgntnBtn(0, '&#x21C0', 'light', true);
			lnkLast = Table.createPgntnBtn(0, '&#x21A0', 'light', true);
		} else {
			lnkNext = Table.createPgntnBtn(currentPage+1, '&#x21C0', 'primary', false);
			lnkLast = Table.createPgntnBtn(lastpg+1,      '&#x21A0', 'primary', false);
			hasPgs = true;
		}

		let boxFirst = pgntn.querySelector('.R4TablePageFirst');
		let boxPrev  = pgntn.querySelector('.R4TablePagePrev');
		let boxNext  = pgntn.querySelector('.R4TablePageNext');
		let boxLast  = pgntn.querySelector('.R4TablePageLast');

		boxFirst.innerHTML = '';
		boxPrev.innerHTML  = '';
		boxNext.innerHTML  = '';
		boxLast.innerHTML  = '';

		boxFirst.appendChild(lnkFirst);
		boxPrev.appendChild(lnkPrev);
		boxNext.appendChild(lnkNext);
		boxLast.appendChild(lnkLast);

		if(hasPgs) {
			let lnks = pgntn.querySelectorAll('button');
			if(lnks.length) {
				Array.prototype.map.call(lnks, function(item){
					let gotopg = item.getAttribute('numPage');
					item.addEventListener('click', function(){
						if(typeof Table.dom[idDestiny].onPagination === 'function') {

							Table.setInfo(destiny, { currentPage: gotopg } );

							Table.dom[idDestiny].onPagination(gotopg);
						}
					});
				});
			}
		}
	},


	createRegPerPage: function(destiny) {
		let li;
		let ul = document.createElement('ul');

		let idDestiny = destiny.id;

		[2, 10, 15, 25, 50, 100, 500].forEach(function(item){
			li = document.createElement('li');
			li.setAttribute('numRegs', item);
			li.innerHTML = item + ' reg/pag';
			li.classList.add('clickable');

			li.addEventListener('click', function(){
				if(typeof Table.dom[idDestiny].onRegPerPage === 'function') {
					Table.setInfo(
						document.getElementById(idDestiny),
						{ regPerPage: item, currentPage: 1 }
					);

					Table.dom[idDestiny].onRegPerPage(item);
				}
			});

			ul.appendChild(li);
		});

		let btnSel = document.createElement('button');
		btnSel.setAttribute('class', 'R4 bgWhite grey');
		btnSel.innerHTML = 'reg/pag';
		$(btnSel).pop({ html: ul });

		let rcpt = document.createElement('div');
		rcpt.setAttribute('class', 'col-2 R4TableRegPerPage');
		rcpt.appendChild(btnSel);

		return rcpt;
	},


	updateRegPerPage: function(destiny, numPage) {

		let regbtn = destiny.querySelector('.R4TableRegPerPage > button');
		if(!regbtn) return;

		regbtn.innerHTML = numPage +' reg/pag';
	},


	getAllSel: function(idElem) {
		let ret = [];
		document.querySelectorAll('#'+ idElem +' tbody input:checked').forEach(elem => {
			ret.push(elem.value);
		});
		return ret;
	}
};