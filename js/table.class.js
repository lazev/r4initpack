// eslint-disable-next-line no-redeclare
var Table = {

	dom: {},

	body: [],
	foot: [],

	lineCells: [],
	cellClass: [],

	iconLnkFirst: '&#x219E',
	iconLnkPrev:  '&#x21BC',
	iconLnkNext:  '&#x21C0',
	iconLnkLast:  '&#x21A0',
	iconOrderBy:  '&#8597',

	create: function(opts) {

		if(!opts) opts = {};

		let idDestiny     = opts.idDestiny;
		let listExtraCols = opts.listExtraCols;
		let selExtraCols  = opts.selExtraCols;

		let arrArrHead = [];

		if(typeof opts.arrHead[0].label != 'undefined') {
			arrArrHead.push(opts.arrHead);
		} else {
			//Header with multiple lines
			opts.arrHead.forEach(line => {
				arrArrHead.push(line);
			});
		}

		let headLastIndex = arrArrHead.length-1;

		if(typeof listExtraCols == 'object') {

			let listCols    = [];
			let objstorage  = {};
			let jsonstorage = localStorage.getItem('listExtraCols');

			if(jsonstorage) objstorage = JSON.parse(jsonstorage);
			if(typeof objstorage[idDestiny] == 'string')
				selExtraCols = objstorage[idDestiny].split(',');

			//Verificar se as colunas estão dentro da lista de possíveis colunas
			arrArrHead[headLastIndex].forEach(col => {
				if(col.listExtraCols) {
					if(selExtraCols.length) {
						selExtraCols.forEach(item => {
							if(item && listExtraCols[item]) {
								listCols.push(listExtraCols[item]);
							}
						});
					}
				} else {
					listCols.push(col);
				}
			});

			arrArrHead[headLastIndex] = listCols;
		}

		Table.dom[idDestiny] = {
			head:         arrArrHead,
			withCheck:    opts.withCheck,
			onOrderBy:    opts.onOrderBy,
			onLineSel:    opts.onLineSel,
			onLineClick:  opts.onLineClick,
			onRegPerPage: opts.onRegPerPage,
			onPagination: opts.onPagination,
			colClasses:   {}
		};

		let arrInfo = opts.arrInfo;
		let arrBody = opts.arrBody;
		let arrFoot = opts.arrFoot;
		let classes = ['R4'];
		if(opts.classes) classes.push(opts.classes);

		let head    = Table.createHead(arrArrHead, idDestiny);
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

		let aftertbl = document.createElement('div');
		aftertbl.setAttribute('class', 'row clearfix');

		let descrTotalReg = document.createElement('div');
		descrTotalReg.setAttribute('class', 'R4FooterDescr col-4 onLeft');
		descrTotalReg.innerHTML = '<div class="R4TotalReg"></div>';

		if(opts.onPagination) {
			let pgntn = Table.createPagination(destiny);
			if(pgntn) aftertbl.appendChild(pgntn);

			let rowspg = Table.createRegPerPage(destiny);
			if(rowspg) aftertbl.appendChild(rowspg);

			destiny.appendChild(aftertbl);
		}

		aftertbl.append(descrTotalReg);

		if(typeof listExtraCols == 'object') {
			Table.listColSelector(idDestiny, listExtraCols, selExtraCols);
		}
	},


	initLine: function() {
		Table.lineCells = [];
		Table.cellClass = [];
	},


	addCell: function(content, classes) {
		if(content === null || content === undefined) content = '';
		if(!classes) classes = '';

		Table.lineCells.push(content);
		Table.cellClass.push(classes);
	},


	getCells: function() {
		return Table.lineCells;
	},


	getClasses: function() {
		return Table.cellClass;
	},


	setInfo: function(elem, params, clicked) {

		let destiny = elem[0] || elem;

		let info = Table.getInfo(destiny);

		if(typeof params.orderBy     !== 'undefined') info.orderBy     = params.orderBy.trim();
		if(typeof params.currentPage !== 'undefined') info.currentPage = params.currentPage;
		if(typeof params.regPerPage  !== 'undefined') info.regPerPage  = params.regPerPage;
		if(typeof params.totalReg    !== 'undefined') info.totalReg    = params.totalReg;

		destiny.setAttribute('orderBy',     info.orderBy     );
		destiny.setAttribute('currentPage', info.currentPage );
		destiny.setAttribute('regPerPage',  info.regPerPage  );
		destiny.setAttribute('totalReg',    info.totalReg    );

		Table.updateOrderBy(destiny,    info.orderBy, clicked);
		Table.updatePagination(destiny, info.regPerPage, info.totalReg, info.currentPage);
		Table.updateRegPerPage(destiny, info.regPerPage);

		let descrRegs = info.totalReg + ((info.totalReg == 1) ? ' registro encontrado' : ' registros encontrados');
		destiny.querySelector('.R4FooterDescr > .R4TotalReg').innerHTML = descrRegs;
	},


	getInfo: function(elem) {
		let arr = [];
		let destiny = elem[0] || elem;

		arr.orderBy     = destiny.getAttribute('orderBy')     || '';
		arr.currentPage = destiny.getAttribute('currentPage') || 1;
		arr.regPerPage  = destiny.getAttribute('regPerPage')  || 50;
		arr.totalReg    = destiny.getAttribute('totalReg')    || 0;

		return arr;
	},


	createHead: function(head, idDestiny) {

		if(!head.length) return false;

		let thead = document.createElement('thead');
		let tr;
		let th;
		let span;
		let positionId = 0;

		head.forEach(linha => {

			Table.dom[idDestiny].lastHead = [];

			tr = document.createElement('tr');

			positionId = 0;

			for(let position in linha) {
				if(Object.hasOwnProperty.call(linha, position)) {

					let cell = linha[position];

					Table.dom[idDestiny].lastHead.push(cell);

					span = document.createElement('span');
					span.innerHTML = ' '+ cell.label;

					th = document.createElement('th');
					th.appendChild(span);

					if(cell.classes) {
						th.setAttribute('class', cell.classes);
					}

					if(cell.colspan) {
						th.setAttribute('colspan', cell.colspan);
					}

					if(cell.colClasses) {
						Table.dom[idDestiny].colClasses[positionId] = cell.colClasses;
					}

					if((positionId == 0) && (Table.dom[idDestiny].withCheck)) {
						let chkelem = document.createElement('input');
						chkelem.setAttribute('type', 'checkbox');
						chkelem.value = 'all';
						chkelem.addEventListener('click', () => {
							chkelem.closest('table').querySelector('tbody').querySelectorAll('input[type=checkbox]')
							.forEach(elem => {
								elem.checked = chkelem.checked;
								elem.dispatchEvent(new Event('change'));
							});
						});
						th.prepend(chkelem);
					}

					if(cell.type == 'integer' || cell.type == 'date') {
						th.classList.add('center');
					}

					else if(cell.type == 'decimal' || cell.type == 'money') {
						th.classList.add('right');
					}

					if(cell.orderBy) {
						span.setAttribute('orderBy', cell.orderBy);
						span.addEventListener('click', function() {
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
					positionId++;
				}
			}

			thead.appendChild(tr);
		});

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

		if(!footLine) {
			if(typeof Table.dom[idDestiny].onLineClick === 'function') {
				tr.classList.add('clickable');
				tr.addEventListener('click', event => {
					if(!event.target.classList.contains('nonClickCol')) {
						Table.dom[idDestiny].onLineClick(
							event.target.parentNode.getAttribute('value'),
							event.target.parentNode
						);
					}
				});
			}
		}

		line.cells.forEach(function(value, position){

			td = document.createElement('td');

			if(Table.dom[idDestiny].lastHead[position]) {

				if(line.classes) {
					if(line.classes[position]) {
						if(line.classes[position].indexOf('R4KeepValue') > -1) {
							td.setAttribute('value', value);
						}
						td.setAttribute('class', line.classes[position]);
					}
				}

				if(Table.dom[idDestiny].colClasses && Table.dom[idDestiny].colClasses[position]) {
					td.setAttribute('class', Table.dom[idDestiny].colClasses[position]);
				}

				let type = Table.dom[idDestiny].lastHead[position].type;

				if(value === null || value === undefined) value = '';

				else if(type == 'integer') {
					td.classList.add('center');
				}
				else if(type == 'decimal') {
					if(value !== '') {
						let precision = Table.dom[idDestiny].lastHead[position].precision ?
							Table.dom[idDestiny].lastHead[position].precision : 2;
						value = R4.numberMask(value, precision);
						td.classList.add('right');
					}
				}
				else if(type == 'money') {
					if(value !== '') {
						if(!isNaN(value)) {
							let precision = Table.dom[idDestiny].lastHead[position].precision ?
								Table.dom[idDestiny].lastHead[position].precision : 2;
							value = R4.moneyMask(value, precision);
						}
						td.classList.add('right');
					}
				}
				else if(type == 'date') {
					value = R4.dateMask(value);
					td.classList.add('center');
				}
				else if(type == 'tags') {
					let box = '<span class="badgeTags">';
					if(value) {
						value = box + value.replaceAll(',', '</span>'+ box) +'</span>';
					}
				}
				else if(type == 'button') {
					let label = Table.dom[idDestiny].lastHead[position].label;
					value = '<button class="R4" value="'+ value +'">'+ label +'</button>'
				}

				if((!footLine) && (position == 0) && (Table.dom[idDestiny].withCheck)) {
					let chkelem = document.createElement('input');
					chkelem.setAttribute('type', 'checkbox');
					chkelem.value = value;
					chkelem.addEventListener('change', function() {
						if(typeof Table.dom[idDestiny].onLineSel === 'function') {
							setTimeout(Table.dom[idDestiny].onLineSel, 10);
						}
						if(this.checked) this.closest('tr').classList.add('R4SelRow');
						else this.closest('tr').classList.remove('R4SelRow');
					});

					let labelem = document.createElement('label');
					labelem.setAttribute('class', 'block nowrap');
					labelem.innerHTML = ' '+ value;
					labelem.prepend(chkelem);
					td.appendChild(labelem);
				}
				else {
					td.innerHTML = ' '+ value;
				}

				td.setAttribute('col-title', Table.dom[idDestiny].lastHead[position].label +': ');

				tr.appendChild(td);
			} else {
				console.warn('');
			}
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

		R4.enableShiftCheck(idDestiny);
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
			icon = '<span class="spinning">'+ Table.iconOrderBy +'</span>';
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


	createPagination: function() {

		let first = document.createElement('div');
		let prev  = document.createElement('div');
		let pgntn = document.createElement('div');
		let next  = document.createElement('div');
		let last  = document.createElement('div');

		pgntn.setAttribute('class', 'col-4 onRight R4TablePgntn hiddenPrint' );
		first.setAttribute('class', 'col-xs-3 center R4TablePageFirst' );
		prev.setAttribute('class',  'col-xs-3 center R4TablePagePrev'  );
		next.setAttribute('class',  'col-xs-3 center R4TablePageNext'  );
		last.setAttribute('class',  'col-xs-3 center R4TablePageLast'  );

		first.innerHTML = Table.iconLnkFirst;
		prev.innerHTML  = Table.iconLnkPrev;
		next.innerHTML  = Table.iconLnkNext;
		last.innerHTML  = Table.iconLnkLast;

		pgntn.appendChild(first);
		pgntn.appendChild(prev);
		pgntn.appendChild(next);
		pgntn.appendChild(last);

		return pgntn;
	},


	createPgntnBtn: function(numPage, icon, disabled) {
		let btn = document.createElement('button');
		btn.setAttribute('type',  'button');
		btn.setAttribute('class', 'R4');
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
			lnkFirst = Table.createPgntnBtn(0, Table.iconLnkFirst, true);
			lnkPrev  = Table.createPgntnBtn(0, Table.iconLnkPrev,  true);
		} else {
			lnkFirst = Table.createPgntnBtn(0,             Table.iconLnkFirst, false);
			lnkPrev  = Table.createPgntnBtn(currentPage-1, Table.iconLnkPrev, false);
			hasPgs = true;
		}

		if(lastreg >= totalReg) {
			lnkNext = Table.createPgntnBtn(0, Table.iconLnkNext, true);
			lnkLast = Table.createPgntnBtn(0, Table.iconLnkLast, true);
		} else {
			lnkNext = Table.createPgntnBtn(currentPage+1, Table.iconLnkNext, false);
			lnkLast = Table.createPgntnBtn(lastpg+1,      Table.iconLnkLast, false);
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

					Pop.destroyByParent(document.getElementById(idDestiny +'BtnRegPerPage'), true);
				}
			});

			ul.append(li);
		});

		let btnSel = document.createElement('button');
		btnSel.setAttribute('type', 'button');
		btnSel.setAttribute('class', 'R4 col-xs-12');
		btnSel.innerHTML = 'reg/pag';
		btnSel.id = idDestiny +'BtnRegPerPage';

		Pop.click(btnSel, { html: ul });

		let rcpt = document.createElement('div');
		rcpt.setAttribute('class', 'col-4 onLeft R4TableRegPerPage hiddenPrint');
		rcpt.append(btnSel);

		return rcpt;
	},


	updateRegPerPage: function(destiny, numPage) {

		let regbtn = destiny.querySelector('.R4TableRegPerPage > button');
		if(!regbtn) return;

		regbtn.innerHTML = numPage +' reg/pag';
	},


	listColSelector: function(idDestiny, listExtraCols, selExtraCols) {

		var btnElem = document.createElement('a');
		btnElem.setAttribute('href', '#');
		btnElem.setAttribute('class', 'hiddenPrint');
		btnElem.innerHTML = 'Escolher colunas';

		let html    = '<div id="'+ idDestiny +'ColSelOptBox" class="R4TableColSelOptBox paspatur"><b>Opções de colunas</b>';
		let fldsObj = [];
		let checked = false;

		for(var k in listExtraCols) {
			checked = selExtraCols.includes(k);
			html += '<div id="listColItem_'+ k +'">'+ listExtraCols[k].label +'</div>';
			fldsObj.push({ id: 'listColItem_'+ k, type: 'switch', checked: checked, value: k });
		}

		html += '<button type="button" class="R4" id="'+ idDestiny +'ColSelBtnSave">Salvar</button>'+
			'</div>';

		Pop.click(btnElem, {
			html: html,
			preventDefault: true,
			onOpen: () => {
				Fields.create(fldsObj);
				document.getElementById(idDestiny +'ColSelBtnSave').addEventListener('click', function(){
					let ret = [];
					document.getElementById(idDestiny +'ColSelOptBox').querySelectorAll('input').forEach(item => {
						if(item.checked) ret.push(item.value);
					});

					let obj  = {};
					let json = localStorage.getItem('listExtraCols');
					if(json) obj = JSON.parse(json);

					obj[idDestiny] = ret.join(',');

					localStorage.setItem('listExtraCols', JSON.stringify(obj));
					document.location.reload();
				});
			}
		});

		document.querySelector('#'+ idDestiny).setAttribute('selExtraCols', selExtraCols.join(','));
		document.querySelector('#'+ idDestiny +' .R4FooterDescr').append(btnElem);
	},


	getAllSel: function(idElem) {
		return Fields.getAllChecked(document.querySelector('#'+ idElem +' tbody'));
	}
};