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

    var query = new AV.Query('Post');

    query.descending('createdAt');
    query.limit(5);
    query.include("pics");
    query.include("location");
    query.find().then(function (posts) {
        posts = posts || [];

        //console.log('------');


        var postsList = [];

        for (var i = 0; i < posts.length; i++) {

            var post = posts[i];

            var itemData = {title:post.get('title'),pics:[],location:{},createdAt:post.createdAt}

            var pics = post.get('pics');

            var picsData = itemData.pics;
            var locationData = itemData.location;

            //console.log(post.createdAt)

            if(pics && pics.length>0)
            {
                for(var p=0;p<pics.length;p++)
                {
                   var pic = pics[p];

                   var pic_url = pic.get('file')['_url'];

                   picsData[p] = {url:pic_url};

                   //console.log(pic_url);
                }

            }


            var locationRaw = post.get('location');

            if(locationRaw)
            {
                //console.log(locationRaw.get('loc_x'));

                locationData.loc_x = locationRaw.get('loc_x');
                locationData.loc_y = locationRaw.get('loc_y');
                locationData.label = locationRaw.get('label');

            }

            postsList[i] = itemData;

        }

        console.log(postsList);

        res.render('list', {
            posts: postsList,
            token: token
        });
    }, mutil.renderErrorFn(res));

}


app.get('/profile', function(req, res){

    var wxIsLogin = false;

    if(wxIsLogin)
    {


    }else
    {
        var state = "wogogo";

        //var appid = 'wxfe82f80f1fd2b2ff';//mp
        var scope = 'snsapi_userinfo';//app
        //var scope = 'snsapi_base';//mp
        var redirect_uri = decodeURI('http://dev.wogogo.avosapps.com/wxlogin');

        var url = "https://open.weixin.qq.com/connect/oauth2/authorize?appid="+appid+"&redirect_uri="+redirect_uri+"&response_type=code&scope="+scope+"&state="+state+"&fromcallback=true#wechat_redirect";

        //var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx05b9d43b6600f4c9&redirect_uri=https%3a%2f%2fwogogo.avosapps.com%2fwxlogin&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
        //var url = 'https://open.weixin.qq.com/connect/oauth2/authorize?appid=wx05b9d43b6600f4c9&redirect_uri=http%3a%2f%2fdev.wogogo.avosapps.com%2fwxlogin&response_type=code&scope=snsapi_userinfo&state=STATE#wechat_redirect';
        console.log('/profile');
        res.redirect(url);
    }


});
var appid = 'wx05b9d43b6600f4c9';//app
var secret = 'e701033c15296b3571d1472a847b1aea';

var app_res;

app.get('/wxlogin', function(req, res){

    app_res = res;

    console.log('/wxlogin',req.query);

    var code = req.query.code;
    var access_token_url = "https://api.weixin.qq.com/sns/oauth2/access_token?appid="+appid+"&secret="+secret+"&code="+code+"&grant_type=authorization_code";

    AV.Cloud.httpRequest({
        url: access_token_url,
        success: function(httpResponse) {

            var accessTokenData = JSON.parse(httpResponse.text);
            var access_token = accessTokenData.access_token;
            var openid = accessTokenData.openid;


            var AccessToken = AV.Object.extend("AccessTokenWX");

            var query = new AV.Query(AccessToken);

            query.equalTo("openid", openid);
            query.first({
                success: function(object) {

                    if(object)
                    {

                        console.log('update '+object.id + ' - ' + object.get('access_token')+' to '+access_token);

                        object.set('access_token',access_token);
                        object.set('refresh_token',accessTokenData.refresh_token);
                        object.save();


                    }else
                    {
                        // 创建该类的一个实例
                        var accessToken = new AccessToken();

                        accessToken.save(accessTokenData, {

                            success: function(gameScore) {
                                console.log(' The accessToken was saved successfully.');
                            },
                            error: function(gameScore, error) {
                                console.log('The accessToken save failed.');
                                // error is a AV.Error with an error code and description.
                            }
                        });
                    }

                },
                error: function(error) {
                    console.log("Error: " + error.code + " " + error.message);
                }
            });

            getUserInfoWX(access_token,openid,showUserInfoWX);


            console.log('access_token',JSON.parse(httpResponse.text));

        },
        error: function(httpResponse) {
            console.error('Request failed with response code ' + httpResponse.status);
        }
    });


});
function showUserInfoWX(userInfo)
{
    var res = app_res;

    res.render('profile', {

        nickname: userInfo.get('nickname'),
        headimgurl: userInfo.get('headimgurl')

    });
}
function getUserInfoWX(access_token,openid,callback)
{
    //查询用户信息
    var UserInfo = AV.Object.extend("UserInfoWX");

    var query = new AV.Query(UserInfo);

    query.equalTo("openid", openid);
    query.first({
        success: function(object) {

            if(object)
            {
                var userInfo = object;

                console.log('find userinfo',userInfo);

                callback && callback(userInfo);

            }else
            {
                var userinfo_url = "https://api.weixin.qq.com/sns/userinfo?access_token="+access_token+"&openid="+openid;
                //不存在，新建用户信息

                AV.Cloud.httpRequest({
                    url: userinfo_url,
                    success: function(httpResponse) {

                        var userInfo = new UserInfo();

                        var userInfoData = JSON.parse(httpResponse.text);

                        if(!userInfoData.errcode)
                        {

                            userInfo.save(userInfoData, {

                                success: function(gameScore) {
                                    console.log(' The userInfo was saved successfully.');
                                },
                                error: function(gameScore, error) {
                                    console.log('The userInfo save failed.');
                                    // error is a AV.Error with an error code and description.
                                }
                            });
                        }
                        callback && callback(userInfo);

                    },
                    error: function(httpResponse) {

                        console.error('Request failed with response code ' + httpResponse.status);

                        callback && callback(undefined);
                    }
                });


            }

        },
        error: function(error) {
            console.log("Error: " + error.code + " " + error.message);
        }
    });

}

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
});

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
});

// 最后，必须有这行代码来使 express 响应 HTTP 请求
app.listen();
