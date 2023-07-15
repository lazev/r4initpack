var Tabs = {

	dom: {},

	create: opts => {

		if(!opts) opts = {};

		let elem         = opts.elem         ?? null;
		let idElem       = opts.idElem       ?? '';
		let primary      = opts.primary      ?? '';
		let itemSelector = opts.itemSelector ?? 'button';
		let onClick      = opts.click        ?? function(){};

		if(!elem && idElem) {
			elem = document.getElementById(idElem);
		}

		if(!elem) {
			console.warn('To use Tabs you need to set the elem or idElem');
			return false;
		}

		let classes = ['R4Tabs'];
		if(opts.classes) classes.push(opts.classes);

		elem.setAttribute('class', classes.join(' '));

		elem.querySelectorAll(itemSelector).forEach(item => {

			let targetId = item.getAttribute('target');

			if(targetId == primary) {
				item.classList.add('R4PrimaryTab');
			}

			if(!document.getElementById(targetId)) {
				console.warn('There is no target elem to tab '+ targetId);
				return false;
			}

			document.getElementById(targetId).classList.add('hidden');

			item.classList.add('R4TabItem');

			item.addEventListener('click', event => {
				event.preventDefault();

				let allTargets = Tabs.getAllTargets(elem);
				if(allTargets.length) {
					allTargets.forEach(trgt => {
						let trgtElem = $('#'+ trgt);
						trgtElem.classList.remove('R4TabTargetOn');
						trgtElem.classList.add('hidden');
					});
				}

				let newTarget;
				let newTargetId = item.getAttribute('target');
				let itemColor = item.getAttribute('color');

				if(newTargetId) {
					if(typeof onClick === 'function') onClick(newTargetId);
					newTarget = document.getElementById(newTargetId);
				}

				if(newTarget) {
					newTarget.classList.remove('hidden');
					newTarget.classList.add('R4TabTargetOn');
				}

				let tabOn = elem.querySelectorAll('.R4TabActive');
				if(tabOn.length) tabOn.forEach(tbon => {
					tbon.classList.remove('R4TabActive');
					tbon.style.backgroundColor = '';
				});

				item.classList.add('R4TabActive');
				item.style.backgroundColor = itemColor;
				elem.style.borderColor = itemColor;

				Tabs.removeErrFieldsMark(item);

				Tabs.markTabsWithErrFields(elem);

			});
		});

		if(primary) Tabs.click(primary);
	},


	getAllTabs: tabElem => {
		return tabElem.querySelectorAll('[target]');
	},


	getAllTargets: tabElem => {
		let ret = [];
		tabElem.querySelectorAll('[target]').forEach(item => {
			 ret.push(item.getAttribute('target'));
		});

		return ret;
	},


	click: targetId => {
		document.querySelector('[target='+ targetId +']').click();
	},


	reset: tabElem => {
		let arr = Tabs.getAllTabs(tabElem);
		if(arr.length) arr.forEach(item => {
			Tabs.removeErrFieldsMark(item);
		});

		let elId = tabElem.querySelector('.R4PrimaryTab').getAttribute('target');
		Tabs.click(elId);
	},


	removeErrFieldsMark: tabItem => {
		let withErrField = tabItem.querySelector('.tabWithErrField');
		if(withErrField) withErrField.remove();
	},


	markTabsWithErrFields: tabElem => {
		let targetArr = Tabs.getAllTargets(tabElem);

		if(targetArr.length) {
			let numErr = 0;
			targetArr.forEach(item => {

				let tabItem = document.querySelector('[target='+ item +']');
				if(!tabItem.classList.contains('R4TabActive')) {
					numErr = document.getElementById(item).querySelectorAll('.errField').length;

					if(numErr > 0) {
						let el = document.createElement('span');
						el.setAttribute('class', 'small badge bgDanger tabWithErrField');
						el.innerHTML = numErr;

						Tabs.removeErrFieldsMark(tabItem);
						tabItem.append(el);
					}
				}
			});
		}

	},


	getActive: tabElem => {
		return tabElem.querySelector('.R4TabActive');
	}
};