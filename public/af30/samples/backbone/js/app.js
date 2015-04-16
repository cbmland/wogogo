(function(){


    "use strict";

    var todos=[];
    var app=Backbone.View.extend({
        el: '#main',
        events: {
            'click #addTodo': 'addTodo',
            'click .thumb': 'showPhoto',
            'longTap li': 'removeTodo'
        },
        template:_.template($('#todoTemplate').html()),
        addTodo:function(item){

            var val='元素item';
            var imgUrl = 'http://ac-0rg4booz.clouddn.com/53cfcd2314328ec8.jpg?imageView/2/w/200/h/200/q/60/format/jpg';

            todos.push(val);

            $("#todoList").append(this.template({title:item.title,img:imgUrl,pics:item.pics}));
        },
        showPhoto:function(e)
        {
            //$('#imgBox').css( "background:url('http://ac-0rg4booz.clouddn.com/53cfcd2314328ec8.jpg') center no-repeat" );
            //$('#imgSmall').attr('src',"http://ac-0rg4booz.clouddn.com/53cfcd2314328ec8.jpg?imageView/2/w/200/h/200/q/60/format/jpg");

            //$('#imgBig').attr('src','http://ac-0rg4booz.clouddn.com/53cfcd2314328ec8.jpg');
            //console.log(e.currentTarget);
            var bg = $(e.currentTarget).css('background-image');
            var imgSmall = bg.replace('url(','').replace(')','');
            var imgBig = imgSmall.substr(0,imgSmall.indexOf('?imageView'));
            //alert(imgBig);

            $('#imageflipimg').css({
                'background-image': 'url(' + imgSmall + ')'
            });

            $.afui.loadContent('#photo',false,false,'pop');

            $('#imageflipimg').css({
                'background-image': 'url(' + imgBig + ')'
            });

        },
        removeTodo:function(e){
            var item=$(e.target);
            todos.splice(todos.indexOf(item.html()),1);
            $(item).remove();
        },
        initialize:function(){


        },
        pageNum:1
    });

    $.afui.ready(function(){

        var a= new app();

            //JSON跨域解决getScript动态添加脚本
            $.getScript('http://dev.wogogo.avosapps.com/page/'+ a.pageNum, function () {
                //console.log(data);

                var items = data;

                for(var i=0;i<data.length;i++)
                {
                    var item = data[i];

                    a.addTodo(item);
                }

            });

    });
})(jQuery);