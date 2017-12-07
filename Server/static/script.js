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
			form_obj.style.display='inline-block';
			for(var i = 0; i < arrayDis.length; i++) {
				var toggle = document.getElementById(arrayDis[i]);
				toggle.style.display='none';
			}
			for(var i = 0; i < arrayButtonL.length; i++) {
				var button = document.getElementById(arrayButtonL[i]);
				button.style.display='inline-block';
				button.style['box-shadow']='2px 2px 5px gray, -2px 2px 5px gray, -2px -2px 5px gray, 2px -2px 5px gray';
				button.style['color']='black';
			}
			for(var i = 0; i < arrayButtonD.length; i++) {
				var button = document.getElementById(arrayButtonD[i]);
				button.style.display='inline-block';
				button.style['box-shadow']='none';
				button.style['color']='blue';
			}
			for(var i = 0; i < arrayButtonH.length; i++) {
				var button = document.getElementById(arrayButtonH[i]);
				button.style.display='none';
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
					event.target.style['background']="green";
				}
			}
			else {
				var str = '{';
				event.target.style['background']="#A8D9FF";
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
				this.$http.post(Assoc[formName], {body: str, responseType: 'json'}).then(
				function (response) {
					if(response.ok) {
						var message = document.getElementsByClassName('message_ajax')[0];
						message.textContent = 'Отправка формы произошла успешно';
						message.style.display='block';
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
						message.textContent = 'Неверный запрос. Проверьте данные';
					}
					else {
						message.textContent = 'При отправке произошла ошибка. Обратитесь в техподдержку';
					}
					message.style.display='block';
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
				event.target.style['color']="red";
			}
			else {
				event.target.style['color']="#00BBFF";
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
			formList[i].style.display="none";
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

$(function() {
  $("#num_card").mask("0000-0000-0000-0000", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#num_bank").mask("00000000000000000000", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#date_act").mask("mm/YY", {
	'translation': {'Y': {pattern: '[0-9]'}, 'm': {pattern: '[0-9]'}},
    clearIfNotMatch: false
  });
});

$(function() {
  $("#bik").mask("000000000", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#from_whom").mask("000000000000", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#num_bank_r").mask("00000000000000000000", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#bik_r").mask("000000000", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#cvc").mask("000", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#num_phone").mask("+7 000 000-00-00", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#getterINN").mask("000000000000", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#sum_p_a").mask("00000", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#sum_p_an").mask("00000", {
    clearIfNotMatch: false
  });
});

$(function() {
  $("#sum_p_r").mask("00000", {
    clearIfNotMatch: false
  });
});

maskInput = { "pay_all": [],
	"pay_any": [],
 "reqpayment": []
};
H5F.setup(document.getElementById("pay_all"));
H5F.setup(document.getElementById("pay_any"));
H5F.setup(document.getElementById("reqpayment"));