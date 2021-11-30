var Pop = {
	openPops: {},
	
	/*
	Pop.hint(elem, txt) - create mouseover hints
	*/
	hint: function(elem, txt) {
		let popel;

		elem.each(el => {
			el.addEventListener('mouseenter', function(){
				popel = Pop.create({
					html: txt,
					destiny: el,
					classes: 'R4PopHint',
					id: 'R4PopHint'+ $().uniqid()
				});
			});

			el.addEventListener('mouseleave', function(){
				Pop.destroyElem(popel);
			});
		});
	},

	
	create: function(opts) {

		let destiny = opts.destiny[0] || opts.destiny;

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
		
		pop.style.top  = topLeft.top + 'px';
		pop.style.left = topLeft.left + 'px';

		let popPos = pop.getBoundingClientRect();

		if(topLeft.left+popPos.width > document.body.clientWidth) {
			pop.style.left = topLeft.left-(topLeft.left+popPos.width-document.body.clientWidth)-10 +'px';
		}
		
		if(topLeft.top+popPos.height > document.body.clientHeight) {
			console.log('maio rque altura');
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


	destroyById: function(idElem, force) {
		let elem = document.getElementById(idElem);
		Pop.destroyElem(elem, force);
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