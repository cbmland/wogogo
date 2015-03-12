var express = require('express');
var xml2js = require('xml2js');
var weixin = require('cloud/weixin.js');
var utils = require('express/node_modules/connect/lib/utils');
var util = require('util');
var _ = require('underscore');

var login = require('cloud/login.js');

var login = require('cloud/login.js');
var mlog = require('cloud/mlog.js');
var muser = require('cloud/muser.js');
var mutil = require('cloud/mutil.js');
var config = require('cloud/config.js');
var admin = require('cloud/madmin.js');


var renderError = mutil.renderError;
var renderErrorFn = mutil.renderErrorFn;
var renderForbidden = mlog.renderForbidden;
var renderInfo = mutil.renderInfo;

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
app.get('/requestEmailVerify', function (req, res) {
    var email = req.query.email;
    AV.User.requestEmailVerfiy(email).then(function () {
        mutil.renderInfo(res, '邮件已发送请查收。');
    }, mutil.renderErrorFn(res));
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

app.get('/', home);

//使用express路由API服务/hello的http GET请求
app.get('/tickets', home);

function home(req, res){

    var token = req.token;
    var cid = req.cid;

    var query = new AV.Query('_File');

    query.descending('createdAt');
    query.limit(5);
    query.find().then(function (tickets) {
        tickets = tickets || [];
        tickets = _.map(tickets, transformTicket);
        console.log(tickets);
        res.render('list', {
            tickets: tickets,
            token: token
        });
    }, mutil.renderErrorFn(res));

}

function transformTicket(t) {

    return {
        id: t.id,
        pics: t.get('url'),
        createdAt: t.createdAt,
        title: t.get('title')
    };
}

app.get('/profile', function(req, res){

    var state = "wogogo";
    var appid = 'wx05b9d43b6600f4c9';
    var redirect_uri = decodeURI('http://dev.wogogo.avosapps.com/wxlogin');

    var url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+appid+"&redirect_uri="+redirect_uri+"&response_type=code&scope=snsapi_userinfo&state="+state+"&fromcallback=true#wechat_redirect";
    
    //var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx05b9d43b6600f4c9&redirect_uri=https%3a%2f%2fwogogo.avosapps.com%2fwxlogin&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
    //var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx05b9d43b6600f4c9&redirect_uri=http%3a%2f%2fdev.wogogo.avosapps.com%2fwxlogin&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
    console.log('/profile');
    res.redirect(url);

    /*
    res.render('profile', {
        tickets: 0,
        token: 0
    });*/
});

app.get('/wxlogin', function(req, res){

    console.log('/wxlogin');
     res.render('profile', {
     tickets: 0,
     token: 0
     });
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
