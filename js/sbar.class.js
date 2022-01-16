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

	onCloseFuncs: {
		right: {},
		left:  {},
		up:    {},
		down:  {}
	},

	opened: {},

	xTouch: 0,
	yTouch: 0,

	create: (opts) => {

		let idElem       = opts.id,
		    direction    = opts.direction,
		    onOpen       = opts.onOpen,
		    onClose      = opts.onClose,
		    opened       = opts.opened,
		    touchMonitor = opts.touchMonitor ?? true,
		    classes      = [];

		let elem = document.getElementById(idElem);

		if(!elem) return;

		elem.style.opacity  = 0;
		elem.style.position = 'fixed';
		elem.classList.add('transition');
		elem.classList.add('R4Sbar');

		classes.forEach(item => {
			elem.classList.add(item);
		});

		elem.setAttribute('R4SbarDirection', direction);

		Sbar.touchEvents[direction][idElem] = 1;
		Sbar.opened[idElem] = 0;

		if(typeof onOpen  == 'function') Sbar.onOpenFuncs[direction][idElem]  = onOpen;
		if(typeof onClose == 'function') Sbar.onCloseFuncs[direction][idElem] = onClose;

		if(direction == 'right')     elem.style.left   = -elem.offsetWidth  +'px';
		else if(direction == 'left') elem.style.right  = -elem.offsetWidth  +'px';
		else if(direction == 'down') elem.style.top    = -elem.offsetHeight +'px';
		else if(direction == 'up')   elem.style.bottom = -elem.offsetHeight +'px';

		if(opts.touchMonitor) {
			document.addEventListener('touchstart', Sbar.touchStart, false);
			document.addEventListener('touchmove',  Sbar.touchMove,  false);
		}

		if(opened) Sbar.open(elem);
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

		document.getElementsByTagName('body')[0].classList.add('sbarOpen');

		Sbar.opened[idElem] = 1;

		if(typeof Sbar.onOpenFuncs[direction][idElem] == 'function') {
			Sbar.onOpenFuncs[direction][idElem]();
		}

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

		document.getElementsByTagName('body')[0].classList.remove('sbarOpen');

		Sbar.opened[idElem] = 0;

		if(typeof Sbar.onCloseFuncs[direction][idElem] == 'function') {
			Sbar.onCloseFuncs[direction][idElem]();
		}

		elem.style.opacity = 0;

		return idElem;
	},


	toggle: elem => {
		let idElem = elem.id;

		if(Sbar.opened[idElem]) {
			Sbar.close(elem);
		} else {
			Sbar.open(elem);
		}
	},


	isOpened: elem => {
		let idElem = elem.id;

		return (Sbar.opened[idElem]);
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