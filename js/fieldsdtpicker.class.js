var FieldsDtPicker = {

	iconBtnNext: '»',
	iconBtnPrev: '«',

	create: elem => {

		let cell, month, year;

		let today        = new Date();
		let currentMonth = today.getMonth();
		let currentYear  = today.getFullYear();
		let months = [
			'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
			'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
		];

		let box = document.createElement('div');
		let tbl = document.createElement('div');

		box.setAttribute('class', 'row R4FieldsDtPicker');
		tbl.setAttribute('class', 'clickable center');

		let elValue = Fields.getVal(elem);

		if(elValue && R4.checkDate(elValue)) {
			let arr = elValue.split('-');
			month = parseInt(arr[1])-1;
			year  = arr[0];
		} else {
			month = currentMonth;
			year  = currentYear;
		}

		let elMonth = document.createElement('select');
		elMonth.setAttribute('class', 'col-4 col-xs-4');
		elMonth.addEventListener('change', function(){
			FieldsDtPicker.createCalendar(
				tbl,
				elem,
				elMonth.value,
				elYear.value,
				elValue
			);
			elem.focus();
		});

		elMonth.addEventListener('blur', function(){
			elem.focus();
		});

		months.forEach((item, key) => {
			cell = document.createElement('option');
			cell.setAttribute('value', key);
			cell.innerHTML = item;
			if(key == month) cell.setAttribute('selected', true);
			elMonth.append(cell);
		});

		let elYear = document.createElement('select');
		elYear.setAttribute('class', 'col-4 col-xs-4');
		elYear.addEventListener('change', function(){
			FieldsDtPicker.createCalendar(
				tbl,
				elem,
				elMonth.value,
				elYear.value,
				elValue
			);
			elem.focus();
		});

		elYear.addEventListener('blur', function(){
			elem.focus();
		});

		for(var ii=currentYear-99; ii<currentYear+100; ii++) {
			cell = document.createElement('option');
			cell.setAttribute('value', ii);
			cell.innerHTML = ii;
			if(ii == year) cell.setAttribute('selected', true);
			elYear.append(cell);
		}

		let btnNext = document.createElement('button');
		btnNext.setAttribute('type', 'button');
		btnNext.setAttribute('class', 'col-2 col-xs-2');
		btnNext.innerHTML = FieldsDtPicker.iconBtnNext;
		btnNext.addEventListener('click', function(){
			if(elMonth.value == 11) {
				elMonth.value = 0;
				elYear.value = parseInt(elYear.value)+1;
			} else {
				elMonth.value = parseInt(elMonth.value)+1;
			}
			FieldsDtPicker.createCalendar(
				tbl,
				elem,
				elMonth.value,
				elYear.value,
				elValue
			);
		});

		let btnPrev = document.createElement('button');
		btnPrev.setAttribute('type', 'button');
		btnPrev.setAttribute('class', 'col-2 col-xs-2');
		btnPrev.innerHTML = FieldsDtPicker.iconBtnPrev;
		btnPrev.addEventListener('click', function(){
			if(elMonth.value == 0) {
				elMonth.value = 11;
				elYear.value = parseInt(elYear.value)-1;
			} else {
				elMonth.value = parseInt(elMonth.value)-1;
			}
			FieldsDtPicker.createCalendar(
				tbl,
				elem,
				elMonth.value,
				elYear.value,
				elValue
			);
		});

		let btnToday = document.createElement('button');
		btnToday.setAttribute('type', 'button');
		btnToday.setAttribute('class', 'col-4 col-xs-4 onRight');
		btnToday.innerHTML = 'Hoje';
		btnToday.addEventListener('click', function() {
			let timezoneOffset = (new Date()).getTimezoneOffset() * 60000;
			FieldsDtPicker.setVal(elem, (new Date(Date.now() - timezoneOffset)).toISOString().substring(0, 10));
			elem.trigger('change');
		});

		FieldsDtPicker.createCalendar(
			tbl,
			elem,
			elMonth.value,
			elYear.value,
			elValue
		);

		tbl.addEventListener('click', function() {
			elem.focus();
			elem.trigger('change');
		});

		box.append(elMonth);
		box.append(elYear);
		box.append(btnPrev);
		box.append(btnNext);
		box.append(tbl);
		box.append(btnToday);

		return box;
	},


	createCalendar: function(elem, destiny, month, year, value) {

		let tbl      = document.createElement('table');
		let firstDay = new Date(year, month).getDay();
		let today    = new Date();
		let weekDays = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sab'];
		let day      = 1;
		let zeroday,
		    zeromonth,
		    cell;

		//Creating week labels
		let row = document.createElement('tr');
		row.setAttribute('class', 'primary');

		weekDays.forEach(item => {
			cell = document.createElement('td');
			cell.innerHTML = item;
			row.append(cell);
			tbl.append(row);
		});

		for (let i = 0; i < 6; i++) {

			let row = document.createElement('tr');

			for(let j = 0; j < 7; j++) {

				if(i === 0 && j < firstDay) {
					cell = document.createElement('td');
					cell.innerHTML = '';
					row.append(cell);
				}

				else if (day > FieldsDtPicker.daysInMonth(month, year)) {
					break;
				}

				else {
					zeroday   = (day < 10) ? '0'+ day : day;
					zeromonth = parseInt(month)+1;
					zeromonth = (zeromonth < 10) ?  '0'+ zeromonth : zeromonth;

					let val = year +'-'+ zeromonth +'-'+ zeroday;

					cell = document.createElement('td');
					cell.innerHTML = day;
					cell.setAttribute('value', val);
					cell.addEventListener('click', function() {
						FieldsDtPicker.setVal(destiny, this.getAttribute('value'));
					});

					if(
						day == today.getDate()
						&& year == today.getFullYear()
						&& month == today.getMonth()
					) {
						cell.setAttribute('class', 'bgFancy corner');
					} else if(j === 0 || j === 6) {
						cell.setAttribute('class', 'bgLight white');
					}

					if(val == value) {
						cell.classList.add('selDay');
					}

					row.append(cell);
					day++;
				}
			}

			tbl.append(row);
		}

		elem.innerHTML = '';

		elem.append(tbl);
	},


	setVal: function(destiny, value) {
		destiny.val(value);
		destiny.focus();
		Pop.destroyByParent(destiny, true);
	},


	daysInMonth: function(month, year) {
		 return 32 - new Date(year, month, 32).getDate();
	}
};
