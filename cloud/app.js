var express = require('express');
var xml2js = require('xml2js');
var weixin = require('cloud/weixin.js');
var utils = require('express/node_modules/connect/lib/utils');
var login = require('cloud/login.js');

// 解析微信的 xml 数据
var xmlBodyParser = function (req, res, next) {
  if (req._body) return next();
  req.body = req.body || {};

  // ignore GET
  if ('GET' == req.method || 'HEAD' == req.method) return next();

  // check Content-Type
  if ('text/xml' != utils.mime(req)) return next();

  // flag as parsed
  req._body = true;

  // parse
  var buf = '';
  req.setEncoding('utf8');
  req.on('data', function(chunk){ buf += chunk });
  req.on('end', function(){  
    xml2js.parseString(buf, function(err, json) {
      if (err) {
          err.status = 400;
          next(err);
      } else {
          req.body = json;
          next();
      }
    });
  });
};

var app = express();

// App 全局配置
app.set('views','cloud/views');   // 设置模板目录
app.set('view engine', 'ejs');    // 设置 template 引擎
app.use(express.bodyParser());    // 读取请求 body 的中间件
app.use(xmlBodyParser);



app.get('/register', function (req, res) {
    if (login.isLogin(req)) {
        res.redirect('/tickets');
    } else {
        res.render('register.ejs');
    }
});

app.post('/register', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    var email = req.body.email;
    if (username && password && email) {
        var user = new AV.User();
        user.set('username', username);
        user.set('password', password);
        user.set('email', email);
        user.signUp(null).then(function (user) {
            login.renderEmailVerify(res, email);
        }, function (error) {
            renderInfo(res, util.inspect(error));
        });
    } else {
        mutil.renderError(res, '不能为空');
    }
});


app.get('/login', function (req, res) {
    if (login.isLogin(req)) {
        res.redirect('/tickets');
    } else {
        res.render('login.ejs');
    }
});

app.post('/login', function (req, res) {
    var username = req.body.username;
    var password = req.body.password;
    AV.User.logIn(username, password, {
        success: function (user) {
            res.redirect('/tickets');
        },
        error: function (user, error) {
            mutil.renderError(res, error.message);
        }
    });
});

app.get('/logout', function (req, res) {
    AV.User.logOut();
    res.redirect('/login');
});

app.get('/', function (req, res) {
    res.redirect('/login');
});

app.post('/upload', function(req, res){
    var fs = require('fs');
    var iconFile = req.files.iconImage;
    if(iconFile){

        fs.readFile(iconFile.path, function(err, data){
            if(err)
                return res.send('读取文件失败');
            var base64Data = data.toString('base64');
            var theFile = new AV.File(iconFile.name, {base64: base64Data});
            theFile.save().then(function(theFile){
                res.send('上传成功！');
            });
        });
    }else
        res.send('请选择一个文件。');
});


app.get('/weixin', function(req, res) {
  console.log('weixin get req:', req.query);
  weixin.exec(req.query, function(err, data) {
    if (err) {
      return res.send(err.code || 500, err.message);
    }
    return res.send(data);
  });
})

app.post('/weixin', function(req, res) {
  console.log('weixin post req:', req.body);
  weixin.exec(req.body, function(err, data) {
    if (err) {
      return res.send(err.code || 500, err.message);
    }
    var builder = new xml2js.Builder();
    var xml = builder.buildObject(data);
    //console.log('res:', data)
    res.set('Content-Type', 'text/xml');
    return res.send(xml);
  });
})

// 最后，必须有这行代码来使 express 响应 HTTP 请求
app.listen();
