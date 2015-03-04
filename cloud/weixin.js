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
            }

        }
    }else if(msg.xml.MsgType == 'image')
    {
        content = '(1/3) 收到您的照片，如果有多个，请继续拍摄，最多不超过5张。发送当前门店地理位置进行下一步。';

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
