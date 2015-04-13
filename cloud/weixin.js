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
            //pic.set("user", msg.xml.FromUserName);
            //pic.save();

            pic.save().then(function(value) {

                console.log('pic.save()',value);

                var photo = new AV.Object("Photo");
                photo.set("user", msg.xml.FromUserName[0]);
                photo.set("file", pic);
                photo.set("postId", '');
                photo.save().then(function(value) {

                    //console.log('photo.save()',value);

                }, function(error) {

                    console.log('photo.save()',error);
                });

            }, function(error) {

                console.log('pic.save()',error);

            });


        });


    }else if(msg.xml.MsgType == 'text')
    {
        var photoNum = 0;

        var post = new AV.Object("Post");
        post.set("user", msg.xml.FromUserName[0]);
        post.set("title", msg.xml.Content[0]);
        post.set("content", msg.xml.Content[0]);
        post.set("approved", 0);
        post.set("photoNum", photoNum);

        post.save().then(function(value) {

            //console.log('post.save()',value);

            function setPostId(results) {

                for (var i = 0; i < results.length; i++) {
                    var object = results[i];
                    object.set('postId',value.id);
                    object.save().then(
                        function(result) {

                            console.log('object set postId =',value.id);

                        },
                        function(error) {

                            console.log('object.save()',error);
                        }
                    );
                }


            }



            //查找图片，更新关联的postId
            var query = new AV.Query('Photo');
            query.equalTo("user", msg.xml.FromUserName[0]);
            query.equalTo("postId", "");
            query.ascending('createdAt');
            query.limit(5);

            query.find().then(
                function(results) {
                    photoNum = results.length;
                    setPostId(results);
                },
                function(error){
                    console.log('Photo.Find()',error);
                }
            );

            //查找地理位置，更新关联的postId
            var query = new AV.Query('Location');
            query.equalTo("user", msg.xml.FromUserName[0]);
            query.equalTo("postId", "");
            query.ascending('createdAt');
            query.limit(5);

            query.find().then(setPostId, function(error){
                    console.log('Photo.Find()',error);
                }
            );


            post.set("photoNum", photoNum);
            post.save();

            content = '(3/3) 爆料成功！你可以在菜单[我自己->我的爆料]查看，审核通过后即出现在优惠榜单上。';

        }, function(error) {

            console.log('post.save()',error);
        });

        /*
        var query = new AV.Query(GameScore);
        query.get("520ca0bbe4b07e8e0e847e31", {
            success: function(gameScore) {
                // The object was retrieved successfully.
            },
            error: function(object, error) {
                // The object was not retrieved successfully.
                // error is a AV.Error with an error code and description.
            }
        });*/


    }else if(msg.xml.MsgType == 'location')
    {

        var location = new AV.Object("Location");
        location.set("user", msg.xml.FromUserName[0]);
        location.set("loc_x", msg.xml.Location_X[0]);
        location.set("loc_y", msg.xml.Location_Y[0]);
        location.set("label", msg.xml.Label[0]);
        location.set("scale", msg.xml.Scale[0]);
        location.set("postId", '');


        location.save().then(function(value) {

            //console.log('location.save()',value);

        }, function(error) {

            console.log('location.save()',error);
        });

        content = '(2/3) 请用简短的文字描述一下优惠内容。如（蛇口沃尔玛洗面奶满50减20活动，速来。）';

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
