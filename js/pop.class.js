var Pop = {
	openPops: {},

	listMouseOverHintFuncs: {},

	//Pop.hint(elem, txt) - Cria hints ao posicionar o cursor do mouse
	hint: function(el, txt) {
		let popel;

		fn = function(ev){
			popel = Pop.create({
				html: txt,
				destiny: el,
				classes: 'R4PopHint',
				id: 'R4PopHint'+ R4.uniqid()
			});
		};

		el.addEventListener('mouseenter', fn);

		el.addEventListener('mouseleave', function(){
			Pop.destroyElem(popel);
		});

		return {
			id: el.id,
			fn: fn
		};

	},


	//Pop.push(elem, opts) - cria box ao clicar com o mouse
	click: function(el, opts) {
		el.addEventListener('click', function(ev){
			if(opts.preventDefault) ev.preventDefault();
			opts.destiny = el;
			return Pop.create(opts);
		});
	},


	create: function(opts) {

		let destiny = opts.destiny;

		if(!destiny) {
			console.warn('To use Pop you need to set the destiny');
			return false;
		}

		if(destiny.getAttribute('R4PopTarget')) return false;

		let html     = opts.html     || '';
		let classes  = [];
		let onOpen   = opts.onOpen   || function(){};
		let id       = opts.id       || destiny.id +'R4Pop';

		if((!id) || (id == 'R4Pop')) {
			id = 'R4Pop'+ Math.random().toString().substr(-9);
		}

		if(opts.classes) classes.push(opts.classes);
		classes.push('R4Pop');

		let pop = document.createElement('div');

		pop.setAttribute('id', id);
		pop.setAttribute('class', classes.join(' '));

		if(typeof html == 'string') {
			pop.innerHTML = html;
		}
		else if(typeof html == 'object') {
			pop.appendChild(html);
		}

		pop.addEventListener('mouseenter', function(event) {
			event.target.classList.add('R4MouseOver');
		});

		pop.addEventListener('mouseleave', function(event) {
			event.target.classList.remove('R4MouseOver');
		});

		document.body.appendChild(pop);

		let destPos = destiny.getBoundingClientRect();

		let topLeft = {
			top:  destPos.bottom + window.pageYOffset,
			left: destPos.left   + window.pageXOffset
		};

		pop.style.top  = topLeft.top  + 'px';
		pop.style.left = topLeft.left + 'px';

		let popPos = pop.getBoundingClientRect();

		if(topLeft.left+popPos.width > document.body.clientWidth) {
			pop.style.left = topLeft.left-(topLeft.left+popPos.width-document.body.clientWidth)-10 +'px';
		}

		if(topLeft.top+popPos.height > document.body.clientHeight) {
			pop.style.top = topLeft.top-(topLeft.top+popPos.height-document.body.clientHeight)-destPos.height +'px';
		}

		destiny.setAttribute('R4PopTarget', id);

		Pop.openPops[id] = true;

		if(typeof onOpen === 'function') {
			onOpen();
		}

		return pop;
	},


	destroyAll: function(force) {
		for(let idElem in Pop.openPops) {
			if(Pop.openPops[idElem]) {
				Pop.destroyById(idElem, force);
			}
		};
	},


	destroyAllExcept: function(idExcept) {
		for(let idElem in Pop.openPops) {
			if(idExcept != idElem) {
				if(Pop.openPops[idElem]) {
					Pop.destroyById(idElem);
				}
			}
		};
	},


	destroyById: function(idElem, force) {
		let elem = document.getElementById(idElem);
		Pop.destroyElem(elem, force);
	},


	destroyByParent: function(elem, force) {
		Pop.destroyElem($('#'+ elem.getAttribute('R4PopTarget')), force);
	},


	destroyElem: function(elem, force) {
		if(elem) {
			if((!elem.classList.contains('R4MouseOver')) || (force)) {
				elem.remove();
				let idElem = elem.getAttribute('id');
				let origin = document.querySelector('[R4PopTarget='+ idElem +']');
				if(origin) origin.removeAttribute('R4PopTarget');
				Pop.openPops[idElem] = false;
			}
		}
	}
};