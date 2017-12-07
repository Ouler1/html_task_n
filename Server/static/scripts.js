var vm = new Vue ({
	el: "#app",
	data: 	{ name: "Индивидуальный предприниматель Гумаров Радик Маратович",
			phone: "+79193977777",
			about: 'Я Гумаров Радик Маратович. Я обучаюсь в Институте Естественных Наук и\
					Математики Уральского Федерального Университета. На данный момент я студент 3-го курса по\
					специальности "Компьютерная безопасность".',
			site: "www.radik.com",
			email: "radik@tochka.com"
		},
	methods: { toggle_form: function (arrayButtonH, arrayButtonD, arrayButtonL, objName, arrayDis) {
			var form_obj = document.getElementById(objName);
			form_obj.style.display='flex';
			for(var i = 0; i < arrayDis.length; i++) {
				var toggle = document.getElementById(arrayDis[i]);
				toggle.style.display='none';
			}
			for(var i = 0; i < arrayButtonL.length; i++) {
				var button = document.getElementById(arrayButtonL[i]);
				button.classList.remove('hided');
				button.classList.remove('dark');
				button.classList.add('light');
			}
			for(var i = 0; i < arrayButtonD.length; i++) {
				var button = document.getElementById(arrayButtonD[i]);
				button.classList.remove('hided');
				button.classList.add('dark');
				button.classList.remove('light');
			}
			for(var i = 0; i < arrayButtonH.length; i++) {
				var button = document.getElementById(arrayButtonH[i]);
				button.classList.add('hided');
				button.classList.remove('dark');
				button.classList.remove('light');
			}
		},
		check_form: function (event) {
			var listInput = event.currentTarget.getElementsByTagName('input');
			var button = event.currentTarget.getElementsByTagName('button')[0];
			var invalid = false;
			for(var i = 0; i < listInput.length; i++) {
				if (listInput[i].name != 'comment') {
					var item = listInput[i];
					if (!(item.checkValidity() && item.value.length != 0)) {
						invalid = true;
						break;
					}
				}
			}
			button.disabled=invalid;
		},
		toggle_radio: function (event, nameRadio, value) {
			var whyS = document.getElementsByName(nameRadio)[0];
			whyS.value = value;
			var e = new Event("keyup", {bubbles: true, cancelable: false});
			event.target.dispatchEvent(e);
		},
		submit_p: function (event, formName, num) {
			if (num == 1) {
				if (event.target == true) {
					event.preventDefault();
				}
				else {
					event.target.classList.remove('upclick');
					event.target.classList.add('downclick');
				}
			}
			else {
				var str = '{';
				event.target.classList.add('upclick');
				event.target.classList.remove('downclick');
				var a = document.getElementById(formName);
				var arrayInput = a.getElementsByTagName('input');
				for(var i = 0; i < arrayInput.length; i++) {
					str += '"' + Tags[formName][i] + '"' + ':' + '"' + arrayInput[i].value + '"' + ',';
					arrayInput[i].value = "";
				}
				str = str.substr(0, str.length - 1);
				str += '}';
				for(var i = 0; i < maskInput[formName].length; i++) {
					maskInput[formName][i].value = "";
				}
				var message = document.getElementsByClassName('message_ajax')[0];
				message.textContent = 'Ожидание ответа';
				message.style.display='flex';
				this.$http.post(Assoc[formName], {body: str, responseType: 'json'}).then(
				function (response) {
					if(response.ok) {
						var message = document.getElementsByClassName('message_ajax')[0];
						message.textContent = 'Отправка формы произошла успешно';
						message.style.display='flex';
						if(formName == 'pay_any') {
							var links = document.createElement('a');
							links.setAttribute('href', response.body);
							links.setAttribute('download', 'download');
							document.body.appendChild(links)
							links.click()
							document.body.removeChild(links)
						}
					}
				},
				function (response) {
					var message = document.getElementsByClassName('message_ajax')[0];
					if(response.status == 400) {
						message.textContent = 'Введённые данные оказались неверны. Проверьте данные и повторите запрос';
					}
					else {
						message.textContent = 'При отправке произошла ошибка. Обратитесь в техподдержку';
					}
					message.style.display='flex';
				});
				if (typeof timer !== "undefined") {
					clearTimeout(timer);
				}
				timer = setTimeout(function () {
					var message = document.getElementsByClassName('message_ajax')[0];
					message.style.display='none';
				}, 10000);
				event.target.disabled=true;
			}	
		},
		clear_form: function (formName) {
			var a = document.getElementById(formName);
			var arrayInput = a.getElementsByTagName('input');
			for(var i = 0; i < arrayInput.length; i++) {
				arrayInput[i].value = '';
			}
			for(var i = 0; i < maskInput[formName].length; i++) {
				maskInput[formName][i].value = "";
			}
			var e = new Event("keyup", {bubbles: true, cancelable: false});
			a.dispatchEvent(e);
		},
		click_clear: function (event, num) {
			if (num == 0) {
				event.target.classList.add('red');
				event.target.classList.remove('light_blue');
			}
			else {	
				event.target.classList.remove('red');
				event.target.classList.add('light_blue');
			}
		},
		more: function (event) {
			var textAbout = document.getElementById('text_about');
			var t = textAbout.getElementsByTagName('p')[0];
			if (t.getAttribute('onner') == '0') {
				t.textContent = this.about;
				t.setAttribute('onner', '1');
				event.target.textContent = 'Скрыть текст';
			}
			else if (t.getAttribute('onner') == '1') {
				t.textContent = t.textContent.substr(0, 100) + '...';
				t.setAttribute('onner', '0');
				event.target.textContent = 'Показать всё';
			}
		}
	},
	created: function () {
		var formList = document.getElementsByTagName('form');
		for(var i = 1; i < formList.length; i++) {
			formList[i].classList.add('hided');
		}
		var button = document.getElementById('pay_action_button');
		button.disabled=true;
		var button = document.getElementById('get_action_button');
		button.disabled=true;
		var button = document.getElementById('create_req_action_button');
		button.disabled=true;
		var message = document.getElementsByClassName('message_ajax')[0];
		message.style.display="none";
	},
	mounted: function () {
		this.$nextTick(function () {
			var textAbout = document.getElementById('text_about');
			var t = textAbout.getElementsByTagName('p')[0];
			var semiT = t.textContent;
			if (semiT.length >= 100) {
				t.textContent = semiT.substr(0, 100) + '...';
				t.setAttribute('onner', '0');
			}
			else {
				var a = document.getElementById('more_text');
				a.style.display='none';
			}
		});
	}
});

Tags = { "pay_all": ["card_number", "date", "cvc", "sum", "comment", "email"],
	"pay_any": ["whom", "bik", "number", "why", "sum"],
 "reqpayment": ["INNGet", "bik", "number", "why", "sum", "phone", "email"]};

Assoc = {
	"pay_all": "/card-payment",
	"reqpayment": "/request-payment",
	"pay_any": "/create-payment"
};

num_card = new IMask(
	document.getElementsByName('num_card')[0], {
	mask: '0000-0000-0000-0000'
});

num_bank = new IMask(
	document.getElementsByName('num_bank')[0], {
	mask: '00000000000000000000'
});

bik = new IMask(
	document.getElementsByName('bik')[0], {
	mask: '000000000'
});

from_whom = new IMask(
	document.getElementsByName('from_whom')[0], {
	mask: '000000000000'
});

num_bank_r = new IMask(
	document.getElementsByName('num_bank_r')[0], {
	mask: '00000000000000000000'
});

bik_r = new IMask(
	document.getElementsByName('bik_r')[0], {
	mask: '000000000'
});

cvc = new IMask(
	document.getElementsByName('cvc')[0], {
	mask: '000'
});

getterINN = new IMask(
	document.getElementsByName('getterINN')[0], {
	mask: '000000000000'
});

num_phone = new IMask(
	document.getElementsByName('num_phone')[0], {
	mask: '+7 000 000-00-00'
});

date_act = new IMask(
	document.getElementsByName('date_act')[0],
	{
		mask: Date,
		pattern: "m/dY",
		groups: {
			d: new IMask.MaskedPattern.Group.Range([17, 35]),
			m: new IMask.MaskedPattern.Group.Range([1, 12])
		},
		min: new Date(2017, 0, 1),
		max: new Date(2035, 0, 1)
	});
 
sum_p_a = new IMask(
	document.getElementsByName('sum_p_a')[0],
	{
		mask: Number,
		min: 1000,
		max: 75000,
		thousandsSeparator: ''
	}
);

sum_p_an = new IMask(
	document.getElementsByName('sum_p_an')[0],
	{
		mask: Number,
		min: 1000,
		max: 75000,
		thousandsSeparator: ''
	}
);

sum_p_r = new IMask(
	document.getElementsByName('sum_p_r')[0],
	{
		mask: Number,
		min: 1000,
		max: 75000,
		thousandsSeparator: ''
	}
);

maskInput = { "pay_all": [sum_p_a, date_act, cvc, num_card],
	"pay_any": [sum_p_an, num_bank, bik, from_whom],
 "reqpayment": [sum_p_r, num_bank_r, bik_r, getterINN, num_phone]
};