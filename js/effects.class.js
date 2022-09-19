var Effects = {

	slideDown: function(elem, callback) {

		if(elem.offsetParent === null) { //Se invisível
			elem.classList.add('R4EffectSlider');
			elem.classList.remove('hidden');

			elem.style.display = 'block';
			let height = elem.scrollHeight + 'px';
			elem.style.display = '';

			elem.classList.add('isVisible');
			elem.style.height = height;

			window.setTimeout(function () {
				elem.style.height = '';
				elem.classList.remove('R4EffectSlider');
				if(typeof callback == 'function') callback(elem);
			}, 100);
		} else {
			elem.classList.remove('hidden');
			if(typeof callback == 'function') callback(elem);
		}
	},


	slideUp: function(elem, callback) {

		if(elem.offsetParent !== null) { //Se visível
			elem.classList.add('R4EffectSlider');
			elem.classList.add('isVisible');

			elem.style.height = elem.scrollHeight + 'px';

			window.setTimeout(function () {
				elem.style.height = '0';
			}, 1);

			window.setTimeout(function () {
				elem.classList.remove('isVisible');
				if(typeof callback == 'function') callback(elem);
			}, 100);
		} else {
			elem.classList.add('hidden');
			if(typeof callback == 'function') callback(elem);
		}
	},


	fadeIn: function(elem, callback, duration, display) {
		if(elem.offsetParent === null) {
			elem.classList.remove('hidden');
			var s = elem.style, step = 25/(duration || 100);
			s.opacity = s.opacity || 0;
			s.display = display || 'block';

			(function fade() {
				if((s.opacity = parseFloat(s.opacity)+step) > 1) {
					s.opacity = 1;
					if(typeof callback == 'function') callback(elem);
				} else {
					setTimeout(fade, 25);
				}
			})();
		} else {
			elem.classList.remove('hidden');
			if(typeof callback == 'function') callback(elem);
		}
	},


	fadeOut: function(elem, callback, duration) {
		if(elem.offsetParent !== null) {
			var s = elem.style, step = 25/(duration || 100);
			s.opacity = s.opacity || 1;

			(function fade() {
				if((s.opacity -= step) < 0) {
					s.display = 'none';
					if(typeof callback == 'function') callback(elem);
				} else {
					setTimeout(fade, 25);
				}
			})();
		} else {
			elem.classList.add('hidden');
			if(typeof callback == 'function') callback(elem);
		}
	},


	highlight: function(elem) {
		elem.classList.add('highlight');
		setTimeout(function(){
			elem.classList.remove('highlight');
		}, 500);
	},


	blink: function(elem, repeat) {
		if(!repeat) repeat = 1;
		let time = 500*repeat;
		elem.classList.add('blink');
		setTimeout(function(){
			elem.classList.remove('blink');
		}, time);
	}
};