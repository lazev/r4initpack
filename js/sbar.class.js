var Sbar = {

	touchEvents: {
		right: {},
		left:  {},
		up:    {},
		down:  {}
	},
	
	onOpenFuncs: {
		right: {},
		left:  {},
		up:    {},
		down:  {}
	},

	opened: {},

	xTouch: 0,
	yTouch: 0,

	create: (opt) => {
		
		let idElem    = opt.id;
		let direction = opt.direction;
		let onOpen    = opt.onOpen;

		let elem;

		elem = document.getElementById(idElem);

		elem.style.opacity  = 0;
		elem.style.position = 'fixed';
		elem.classList.add('transition');
		elem.setAttribute('R4SbarDirection', direction);

		Sbar.touchEvents[direction][idElem] = 1;
		Sbar.opened[idElem] = 0;

		if(typeof onOpen == 'function') Sbar.onOpenFuncs[direction][idElem] = onOpen;

		if(direction == 'right')     elem.style.left   = -elem.offsetWidth +'px';
		else if(direction == 'left') elem.style.right  = -elem.offsetWidth +'px';
		else if(direction == 'down') elem.style.top    = -elem.offsetHeight +'px';
		else if(direction == 'up')   elem.style.bottom = -elem.offsetHeight +'px';

		document.addEventListener('touchstart', Sbar.touchStart, false);
		document.addEventListener('touchmove',  Sbar.touchMove,  false);
	},
	
	
	open: elem => {

		let idElem    = elem.id;
		let direction = elem.getAttribute('R4SbarDirection');

		if(Sbar.opened[idElem]) return idElem;

		elem.style.opacity = 1;
		
		if(direction == 'right')     elem.style.left   = 0;
		else if(direction == 'left') elem.style.right  = 0;
		else if(direction == 'down') elem.style.top    = 0;
		else if(direction == 'up')   elem.style.bottom = 0;
	
		if(typeof Sbar.onOpenFuncs[direction][idElem] == 'function') {
			Sbar.onOpenFuncs[direction][idElem]();
		}
		
		Sbar.opened[idElem] = 1;
		
		return idElem;
	},


	close: elem => {
		let idElem    = elem.id;
		let direction = elem.getAttribute('R4SbarDirection');
		
		if(!Sbar.opened[idElem]) return idElem;
		
		if(direction == 'right')     elem.style.left   = -elem.offsetWidth +'px';
		else if(direction == 'left') elem.style.right  = -elem.offsetWidth +'px';
		else if(direction == 'down') elem.style.top    = -elem.offsetHeight +'px';
		else if(direction == 'up')   elem.style.bottom = -elem.offsetHeight +'px';

		elem.style.opacity = 0;
	
		Sbar.opened[idElem] = 0;
		
		return idElem;
	},
	
	
	touchStart: event => {
		Sbar.xTouch = event.touches[0].clientX;
		Sbar.yTouch = event.touches[0].clientY;
	},


	touchMove: event => {
		if(!Sbar.xTouch || !Sbar.yTouch) return;

		let opendirection  = '';
		let closedirection = '';

		let xRelease = event.touches[0].clientX;
		let yRelease = event.touches[0].clientY;

		let xDiff = Sbar.xTouch - xRelease;
		let yDiff = Sbar.yTouch - yRelease;

		if(Math.abs(xDiff) < 50 && Math.abs(yDiff) < 50) return;
		
		if(Math.abs(xDiff) > Math.abs(yDiff)) {
			opendirection  = (xDiff > 0) ? 'left'  : 'right';
			closedirection = (xDiff > 0) ? 'right' : 'left';
		} else {
			opendirection  = (yDiff > 0) ? 'up'   : 'down';
			closedirection = (yDiff > 0) ? 'down' : 'up';
		}
		
		for(let idElem in Sbar.touchEvents[opendirection]) {
			if(Sbar.touchEvents[opendirection][idElem]) {
				Sbar.open(document.getElementById(idElem));
			}
		}

		for(let idElem in Sbar.touchEvents[closedirection]) {
			if(Sbar.touchEvents[closedirection][idElem]) {
				Sbar.close(document.getElementById(idElem));
			}
		}

		Sbar.xTouch = 0;
		Sbar.yTouch = 0;
	}
};