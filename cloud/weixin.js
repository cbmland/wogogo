var crypto = require('crypto');
var config = require('cloud/config/weixin.js');
var debug = require('debug')('AV:weixin');

exports.exec = function(params, cb) {
  if (params.signature) {
    checkSignature(params.signature, params.timestamp, params.nonce, params.echostr, cb);
  } else {
    receiveMessage(params, cb)
  }
}

// 验证签名
var checkSignature = function(signature, timestamp, nonce, echostr, cb) {
  var oriStr = [config.token, timestamp, nonce].sort().join('')
  var code = crypto.createHash('sha1').update(oriStr).digest('hex');
  debug('code:', code)
  if (code == signature) {
    cb(null, echostr);
  } else {
    var err = new Error('Unauthorized');
    err.code = 401;
    cb(err);
  }
}

// 接收普通消息
var receiveMessage = function(msg, cb) {

    //console.log('weixin Event:', msg.xml.Event);

    var content = '';
    if(msg.xml.MsgType == 'event')//操作事件
    {
        if (msg.xml.Event == 'CLICK')
        {
            if(msg.xml.EventKey == 'KEY_I_LIKE')
            {
                content = '谢谢点赞！'

            }else if(msg.xml.EventKey == 'KEY_USER_GUID')
            {
                content = '爆料方式简单、迅速，全程使用微信操作。\n\n第一步，拍摄实物照片（可以拍摄多张照片，至少1张，最多5张）\n\n第二步，发送当前门店所在的位置信息，以便准确前往。\n\n第三步，用简短的文字描述一下优惠内容。如（蛇口沃尔玛旁氏洗面奶满50减20活动，速来。）'

            }else if(msg.xml.EventKey == 'KEY_INPUT_TEXT')
            {
                content = '↙点击左下角的键盘图标可切换输入模式 :)';
            }

        }
    }else if(msg.xml.MsgType == 'image')
    {
        var fs = require('fs');
        //console.log(msg.xml.FromUserName, msg.xml.PicUrl);
        //var file = AV.File.withURL(msg.xml.FromUserName, msg.xml.PicUrl[0]);
        //获取所有元信息组成的JSON对象
        //var metadata = file.metaData();
        //设置format元信息
        //file.metaData('format','image/jpeg');
        //metadata.mimeType = 'image/jpeg';
        //file.ownerId('12345');
        //获得宽度为100像素，高度200像素的缩略图
        //var url = file.thumbnailURL(100, 200);
        //console.log('thumbnailURL',url);
        //file.setACL(new AV.ACL(AV.User.current()));
        //console.log('file',file);
        //file.save().then(function(result){console.log('result',result)},function(error){console.log('error',error)})

        content = '(1/3) 收到您的照片，如果有多个，请继续拍摄，最多不超过5张。发送当前门店地理位置进行下一步。';


        var imgUrl = msg.xml.PicUrl[0];

        //imgUrl = 'https://leancloud.cn/docs/images/permission.png';

        var request = require('request');
        //var fs = require('fs');


        var r = request({url:imgUrl,method:'GET',encoding:null},function(error,response,body){

            console.log('imgUrl request',imgUrl,response,body);

            //var base64Data = body.toString('base64');
            //var pic = new AV.File("test.png",  {base64: base64Data});
            //console.log('imgUrl base64',base64Data);

            var pic = new AV.File("wx_photo.jpg",  body);

            pic.save();

            pic.save().then(function(value) {

                console.log('pic.save()',value);

                var photo = new AV.Object("Photo");
                photo.set("user", msg.xml.FromUserName);
                photo.set("file", pic);
                photo.save();

            }, function(error) {
                // The file either could not be read, or could not be saved to AV.
            });




        });


    }else if(msg.xml.MsgType == 'text')
    {
        content = '(2/3) 爆料成功！你可以在菜单[我自己->我的爆料]查看，审核通过后即出现在优惠榜单上。';

    }else if(msg.xml.MsgType == 'location')
    {
        content = '(3/3) 请用简短的文字描述一下优惠内容。如（蛇口沃尔玛洗面奶满50减20活动，速来。）';
    }

  var result = {
    xml: {
      ToUserName: msg.xml.FromUserName[0],
      FromUserName: '' + msg.xml.ToUserName + '',
      CreateTime: new Date().getTime(),
      MsgType: 'text',
      Content: content
    }
  }
  cb(null, result);
}
