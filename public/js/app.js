(function(){


    "use strict";

    var todos=[];
    var APP=Backbone.View.extend({
        el: '#main',
        events: {
            'click #addTodo': 'getNextPage',

            'click .thumb': 'showPhoto',
            'longTap li': 'removeTodo'
        },
        template:_.template($('#todoTemplate').html()),
        addTodo:function(item){

            todos.push(item);

            $("#todoList").append(this.template({title:item.title,pics:item.pics}));
        },
        getNextPage:function(e){


            //JSON跨域解决getScript动态添加脚本

            var that = this;
            $.getScript('http://dev.wogogo.avosapps.com/page/'+ this.pageNum, function () {
                //console.log(data);
                var items = data;

                if(items && items.length>0)
                {
                    for(var i=0;i<data.length;i++)
                    {
                        var item = data[i];

                        that.addTodo(item);
                    }

                    that.pageNum++;

                }else{

                    alert('已没有更多的数据。');
                }

            });
        }
        ,
        hidePhoto:function(e){

            //console.log(e);
            //
            $.afui.loadContent('#main',false,false,'fade');

            $.afui.hideMask();

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

            $.afui.loadContent('#photo',false,false,'flip');
            //$.afui.showMask();
            var inter = setTimeout($.afui.showMask,300)

            $('<img/>').attr('src', imgBig).load(function() {
                $(this).remove(); // prevent memory leaks as @benweet suggested
                $('#imageflipimg').css({'background-image': 'url(' + imgBig + ')'});
                clearTimeout(inter);
                $.afui.hideMask();

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

        var app= new APP();
        $.afui.useOSThemes=false;
        $.afui.app = app;
        app.getNextPage();
        $.afui.goBack();

    });
})(jQuery);