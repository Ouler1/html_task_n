import tornado.ioloop
import tornado.web
import tornado.escape
import tornado.gen
import tornado.options
import tornado
import tornado.httpserver
import random
import re
import mimetypes
import postgresql
import datetime
import time
import os
import threading


ADMIN_PASS = 'Planetarii'
FORM = ''
COUNT = 0
SYMBOLS = {b'\xd0\x9d': b'\x1d\x04', b'\xd0\x94': b'\x14\x04', b'\xd0\xa1': b'\x21\x04',
           b'\xd0\x91': b'\x11\x04', b'\xd0\xb5': b'\x35\x04', b'\xd0\xb7': b'\x37\x04'}
HOST = 'http://webtask1.ddns.net/'
LOCKC = threading.Lock()
ASSOCTIATION_MIME = {'css': 'text/css', 'js': 'text/javascript'}
CHECKLIST = {
    'card_payment': {'card_number': '[0-9]{4}-[0-9]{4}-[0-9]{4}-[0-9]{4}', 'date': '((0[0-9])|(1[012]))/((1[789])|(2[0-9])|(3[012345]))', 'cvc': '[0-9]{3}',
                     'sum': '([1-9][0-9]{3})|([1-6][0-9]{4})|(7[0-5][0-9]{3})', 'comment': '.*', 'email': '[^@]+@[^@]+\.[^@]+'},
    'reqpayment': {'INNGet': '[0-9]{10}|[0-9]{12}', 'bik': '[0-9]{9}', 'number': '[0-9]{20}',
                      'why': '\w*', 'sum': '([1-9][0-9]{3})|([1-6][0-9]{4})|(7[0-5][0-9]{3})', 'phone': '\+7[0-9]{6}-[0-9]{2}-[0-9]{2}',
                    'email': '[^@]+@[^@]+\.[^@]+'},
    'create_payment': {'whom': '[0-9]{10}|[0-9]{12}', 'bik': '[0-9]{9}', 'number': '[0-9]{20}',
                      'why': '\w*', 'sum': '([1-9][0-9]{3})|([1-6][0-9]{4})|(7[0-5][0-9]{3})'}
}
TABLESVAR = {
    'card_payment': [],
    'reqpayment': []
}
SORTVAR = ('asc', 'desc')
DB = postgresql.open('pq://postgres:palantir@localhost:10000/payment_db')
# class Application(tornado.web.Application):
#     def __init__(self):
#         handlers = [
#             (r"/", MainHandler),
#         ]
#         settings = dict(
#             template_path=os.path.join(os.path.dirname(__file__), "templates"),
#             static_path=os.path.join(os.path.dirname(__file__), ""),
#             xsrf_cookies=True,
#             cookie_secret="11oETzKXQAGaYdkL5gEmGeJJFuYh7EQnp2XdTP1o/Vo=",
#         )
#         tornado.web.Application.__init__(self, handlers, **settings)

class BaseHandler(tornado.web.RequestHandler):
    def get_current_user(self):
        return self.get_secure_cookie("user", max_age_days=1)

class MainHandler(tornado.web.RequestHandler):
    def get(self):
        with open('static_page.html', encoding='utf-8') as f:
            text = f.read()
        user_agent = self.request.headers.get_list("user-agent")[0]
        print(user_agent)
        if (re.search('MSIE', user_agent) or re.search('rv:11.0', user_agent) or \
        (re.search('Safari', user_agent) and not re.search('Chrome', user_agent))):
            text = text.replace('<script src="static/scripts.js"></script>', '')
            text = text.replace('<link rel="stylesheet" href="static/stylesA.css">', '')
        else:
            text = text.replace('<link rel="stylesheet" href="static/styles_old.css">', '')
            text = text.replace('<script src="static/script.js"></script>', '')
        if re.search('MSIE', user_agent) or re.search('rv:11.0', user_agent) or re.search('Edge', user_agent):
            text = text.replace("pattern='([1-9][0-9]{3})|([1-6][0-9]{4})|(7[0-5][0-9]{3})'", '')
        self.write(text)

class FileHandler(tornado.web.RequestHandler):
    def get(self, name):
        a = name.rindex('.')
        ext = name[a + 1:]
        name = name[:a]
        print('Файл запрошен:', name + '.' + ext)
        if(re.match('images', name)):
            namefile = 'static/' + name + '.' + ext
            with open(namefile, 'rb') as f:
                text = f.read()
            mime_type = mimetypes.guess_type(namefile)[0]
            self.set_header('Content-Type', mime_type + '; charset=UTF-8')
            self.write(text)
        else:
            with open('static/{}.{}'.format(name, ext), encoding='utf-8') as f:
                text = f.read()
            self.set_header('Content-Type', ASSOCTIATION_MIME.get(ext) + '; charset=UTF-8')
            self.write(text)

class CardPaymentHandler(BaseHandler):
    def check_xsrf_cookie(self):
        if self.request.method != 'POST':
            tornado.web.RequestHandler.check_xsrf_cookie(self)
        elif self.request.method == 'GET' or self.request.method == 'PATCH':
            tornado.web.RequestHandler.check_xsrf_cookie(self)

    def patch(self):
        if not self.current_user:
            print(self.current_user)
            self.redirect("/login")
            return
        print(self.request.body)
        data = tornado.escape.json_decode(self.request.body).get('body')
        data = tornado.escape.json_decode(data)
        change = DB.prepare("UPDATE card_payment SET is_safe=$1 WHERE id_record=$2")
        change(0 if data.get('is_safe')=='false' else 1, int(data.get('id_record').replace(' ', '')))
        self.set_status(200)

    @tornado.gen.coroutine
    def post(self):
        yield self.send_record()

    def send_record(self):
        data = tornado.escape.json_decode(self.request.body).get('body')
        data = tornado.escape.json_decode(data)
        print(data)
        if not self.check_record(data):
            ins = DB.prepare("INSERT INTO card_payment (number_card, date_card, cvc, sum, comment, email)"
                             " VALUES ($1, $2, $3, $4, $5, $6)")
            ins(data.get('card_number').replace('-', ''),
                datetime.datetime.strptime(
                    '20{}-{}-01'.format(data.get('date').split('/')[1], data.get('date').split('/')[0]), '%Y-%m-%d'),
                data.get('cvc'), int(data.get('sum').replace(' ', '')), data.get('comment'), data.get('email'))
            self.set_status(200)
        else:
            self.set_status(400)

    def check_record(self, data):
        invalid = False
        for key, value in CHECKLIST.get('card_payment').items():
            if not re.match(value, data.get(key).replace(' ', '')):
                invalid = True
                print(key)
                break
        return invalid

    def get(self):
        if not self.current_user:
            print(self.current_user)
            self.redirect("/login")
            return
        sort_string = ''
        filter = ''
        try:
            if self.get_query_argument('field_s') not in TABLESVAR.get('card_payment'):
                raise Exception
            if self.get_query_argument('sort') not in SORTVAR:
                raise Exception
            sort_string = 'ORDER BY {} {}'.format(self.get_query_argument('field_s'),
                                                  self.get_query_argument('sort'))
        except Exception:
            pass
        try:
            if self.get_query_argument('field_f') not in TABLESVAR.get('card_payment'):
                raise Exception
            if self.get_query_argument('filter') == '':
                raise Exception
            filter = "WHERE CAST({} AS VARCHAR) LIKE \'{}%\'".format(self.get_query_argument('field_f'),
                                                                    self.get_query_argument('filter'))
        except Exception:
            pass
        records = DB.query("""
                           SELECT * FROM card_payment
                           {}
                           {}
                           FETCH FIRST 1000 ROWS ONLY
                           """.format(filter, sort_string))
        json_records = []
        json_records.extend([
            {'id': 9},
            {'text': 'id_record', 'alias': 'ID'},
            {'text': 'number_card', 'alias': 'Номер карты'},
            {'text': 'date_card', 'alias': 'Дата действия'},
            {'text': 'cvc', 'alias': 'CVC'},
            {'text': 'sum', 'alias': 'Сумма'},
            {'text': 'comment', 'alias': 'Комментарий'},
            {'text': 'email', 'alias': 'Адрес'},
            {'text': 'date_pay', 'alias': 'Дата отправки'},
            {'text': 'is_safe', 'alias': 'Небезопасный платёж'}
        ])
        for i in range(len(records)):
            json_record = dict()
            json_record.update({'id_record': records[i][8]})
            json_record.update({'number_card': records[i][0]})
            json_record.update({'date_card': datetime.datetime.strftime(records[i][1], "%Y-%m")})
            json_record.update({'cvc': records[i][2]})
            json_record.update({'sum': records[i][3]})
            json_record.update({'comment': records[i][4]})
            json_record.update({'email': records[i][5]})
            json_record.update({'date_pay': datetime.datetime.strftime(records[i][7], "%Y-%m-%d %H:%M:%S")})
            json_record.update({'is_safe': records[i][6]})
            json_records.append(json_record)
        json_records = tornado.escape.json_encode(json_records)
        print(json_records)
        self.write(json_records)

class RequestPaymentHandler(BaseHandler):
    def check_xsrf_cookie(self):
        if self.request.method != 'POST':
            tornado.web.RequestHandler.check_xsrf_cookie(self)
        elif self.request.method == 'GET' or self.request.method == 'PATCH':
            tornado.web.RequestHandler.check_xsrf_cookie(self)

    @tornado.gen.coroutine
    def post(self):
        yield self.send_record()

    def send_record(self):
        data = tornado.escape.json_decode(self.request.body).get('body')
        data = tornado.escape.json_decode(data)
        print(data)
        if not self.check_record(data):
            ins = DB.prepare("INSERT INTO request_payment (inn_get, bik, account_number, reason, sum, phone, email)"
                             " VALUES ($1, $2, $3, $4, $5, $6, $7)")
            ins(data.get('INNGet'), data.get('bik'), data.get('number'), data.get('why'),
                int(data.get('sum').replace(' ', '')),
                data.get('phone').replace(' ', '').replace('-', '').replace('+', ''), data.get('email'))
            self.set_status(200)
        else:
            self.set_status(400)

    def check_record(self, data):
        invalid = False
        for key, value in CHECKLIST.get('reqpayment').items():
            if not re.match(value, data.get(key).replace(' ', '')):
                invalid = True
                print(key)
                break
        return invalid

    def get(self):
        if not self.current_user:
            print(self.current_user)
            self.redirect("/login")
            return
        sort_string = ''
        filter = ''
        try:
            if self.get_query_argument('field_s') not in TABLESVAR.get('reqpayment'):
                raise Exception
            if self.get_query_argument('sort') not in SORTVAR:
                raise Exception
            sort_string = 'ORDER BY {} {}'.format(self.get_query_argument('field_s'),
                                                  self.get_query_argument('sort'))
        except Exception:
            pass
        try:
            if self.get_query_argument('field_f') not in TABLESVAR.get('reqpayment'):
                raise Exception
            if self.get_query_argument('filter') == '':
                raise Exception
            filter = "WHERE CAST({} AS VARCHAR) LIKE \'{}%\'".format(self.get_query_argument('field_f'),
                                                                    self.get_query_argument('filter'))
        except Exception:
            pass
        records = DB.query("""
                           SELECT * FROM request_payment
                           {}
                           {}
                           FETCH FIRST 1000 ROWS ONLY
                           """.format(filter, sort_string))
        json_records = []
        json_records.extend([
            {'id': 9},
            {'text': 'id_record', 'alias': 'ID'},
            {'text': 'inn_get', 'alias': 'ИНН получателя'},
            {'text': 'bik', 'alias': 'БИК'},
            {'text': 'account_number', 'alias': 'Номер счёта'},
            {'text': 'why', 'alias': 'Причина'},
            {'text': 'sum', 'alias': 'Сумма'},
            {'text': 'phone', 'alias': 'Номер телефона'},
            {'text': 'email', 'alias': 'Адрес'},
            {'text': 'date_pay', 'alias': 'Дата отправки'},
        ])
        for i in range(len(records)):
            json_record = dict()
            json_record.update({'id_record': records[i][8]})
            json_record.update({'inn_get': records[i][0]})
            json_record.update({'bik': records[i][1]})
            json_record.update({'number': records[i][2]})
            json_record.update({'why': records[i][3]})
            json_record.update({'sum': records[i][4]})
            json_record.update({'phone': records[i][5]})
            json_record.update({'email': records[i][6]})
            json_record.update({'date_pay': datetime.datetime.strftime(records[i][7], "%Y-%m-%d %H:%M:%S")})
            json_records.append(json_record)
        json_records = tornado.escape.json_encode(json_records)
        print(json_records)
        self.write(json_records)

class CreatePaymentHandler(tornado.web.RequestHandler):
    def check_xsrf_cookie(self):
        pass

    @tornado.gen.coroutine
    def post(self):
        data = tornado.escape.json_decode(self.request.body).get('body')
        data = tornado.escape.json_decode(data)
        cond = yield self.check_record(data)
        if not cond:
            yield self.fileFormer()

    @tornado.gen.coroutine
    def check_record(self, data):
        invalid = False
        for key, value in CHECKLIST.get('create_payment').items():
            if not re.match(value, data.get(key).replace(' ', '')):
                invalid = True
                print(key)
                break
        return invalid

    @tornado.gen.coroutine
    def fileFormer(self):
        global COUNT
        filename = 'filesUser/' + str(random.randint(0, 1000000)) + '-'
        for i in range(60):
            filename += str(random.randint(0, 9))
        filename += '.doc'
        data = tornado.escape.json_decode(self.request.body).get('body')
        data = tornado.escape.json_decode(data)
        with open(filename, 'bw') as f:
            temp_form = FORM
            LOCKC.acquire()
            temp_form = self.docFormat(temp_form, bytes('{\x001\x00}\x00', encoding='utf-8'), str(COUNT))
            COUNT += 1
            with open('static/count.txt', 'w', encoding='utf-8') as g:
                g.write(str(COUNT))
            LOCKC.release()
            temp_form = self.docFormat(temp_form, bytes('{\x002\x00}\x00', encoding='utf-8'), data.get('sum') + ',00' if not re.findall(',', data.get('sum')) else '')
            temp_form = self.docFormat(temp_form, bytes('{\x003\x00}\x00', encoding='utf-8'), data.get('why'))
            temp_form = self.docFormat(temp_form, bytes('{\x004\x00}\x00', encoding='utf-8'), data.get('bik'))
            temp_form = self.docFormat(temp_form, bytes('{\x005\x00}\x00', encoding='utf-8'), data.get('whom'))
            temp_form = self.docFormat(temp_form, bytes('{\x006\x00}\x00', encoding='utf-8'), data.get('number'))
            # temp_form = temp_form.replace(b'\x00{\x002\x00}', self.docFormat((data.get('sum') + '-00')))
            # temp_form = temp_form.replace(b'\x00{\x003\x00}', self.docFormat(data.get('why')))
            # temp_form = temp_form.replace(b'\x00{\x004\x00}', self.docFormat(data.get('bik')))
            # temp_form = temp_form.replace(b'\x00{\x005\x00}', self.docFormat(data.get('whom')))
            # temp_form = temp_form.replace(b'\x00{\x006\x00}', self.docFormat(data.get('number')))
            f.write(temp_form)
        yield self.write(HOST + filename)

    def docFormat(self, text, index_str, string):
        index = text.index(index_str)
        n_str = b''
        for let in string:
            sym = let.encode('utf-8')
            if len(sym) != 2:
                n_str += sym + b'\x00'
            else:
                n_str += SYMBOLS.get(sym)
        text = text[:index] + n_str + text[index + len(n_str):]
        return text

class FaviconHandler(tornado.web.RequestHandler):
    def get(self):
        print(self.request.body)

class AdminHandler(BaseHandler):
    def check_xsrf_cookie(self):
        if self.request.method != 'POST':
            tornado.web.RequestHandler.check_xsrf_cookie(self)

    def get(self):
        if not self.current_user:
            print(self.current_user)
            self.redirect("/login")
            return
        with open('admin.html', encoding='utf-8') as f:
            text = f.read()
        print(self.current_user)
        self.write(text)

    def post(self):
        data = tornado.escape.json_decode(self.request.body).get('body')
        data = tornado.escape.json_decode(data)
        if data.get('command') == 'exit':
            self.clear_cookie('user')
            self.redirect("/login")

class LoginHandler(BaseHandler):
    def check_xsrf_cookie(self):
        pass

    def get(self):
        self.write('<html><body><form action="/login" method="post">'
                   'Password: <input type="text" name="password">'
                   '<input type="submit" value="Sign in">'
                   '</form></body></html>')

    def post(self):
        password = self.get_argument("password")
        print(password)
        if password == ADMIN_PASS:
            self.set_secure_cookie("user", self.get_argument("password"), expires_days=1)
            self.redirect("/admin")
        self.redirect("/login")

class LoadHandler(tornado.web.RequestHandler):
    @tornado.gen.coroutine
    def get(self, file):
        yield self.loadFile(file)

    @tornado.gen.coroutine
    def loadFile(self, file):
        filename = 'filesUser/' + file + '.doc'
        mime_type = mimetypes.guess_type(filename)[0]
        self.set_header('Content-Type', mime_type + '; charset=utf-8')
        self.set_header('Content-Disposition', 'attachment; filename="payment.txt"')
        pay_file = open(filename, 'br')
        yield self.write(pay_file.read())
        pay_file.close()
        yield self.deleteFile(filename)

    def deleteFile(self, filename):
        os.remove(filename)

def make_app():
    application = tornado.web.Application([
        (r"/", MainHandler),
        (r"/admin", AdminHandler),
        (r"/favicon.ico", FaviconHandler),
        (r"/static/(.*?)", FileHandler),
        (r"/card-payment", CardPaymentHandler),
        (r"/request-payment", RequestPaymentHandler),
        (r"/create-payment", CreatePaymentHandler),
        (r"/filesUser/(\d*?-\d*).doc", LoadHandler),
        (r"/login", LoginHandler)
    ], cookie_secret="hewur38274h28vb27348vb2jd382g2vb38247gv3",
        xsrf_cookies=True)
    http_server = tornado.httpserver.HTTPServer(application)
    return http_server

def prep():
    global FORM
    global COUNT
    global DB
    global TABLESVAR
    with open('static/form.doc', 'br') as f:
        FORM = f.read()
    with open('static/count.txt', 'r', encoding='utf-8') as f:
        COUNT = int(f.read())
    ps = DB.prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'card_payment'")
    for s in ps():
        arr = TABLESVAR.get('card_payment')
        arr.append(s[0])
        TABLESVAR.update({'card_payment': arr})
    ps = DB.prepare("SELECT column_name FROM information_schema.columns WHERE table_name = 'request_payment'")
    for s in ps():
        arr = TABLESVAR.get('reqpayment')
        arr.append(s[0])
        TABLESVAR.update({'reqpayment': arr})
    print(TABLESVAR)

if __name__ == "__main__":
    tornado.options.parse_command_line()
    prep()
    app = make_app()
    app.listen(8000)
    tornado.ioloop.IOLoop.current().start()
