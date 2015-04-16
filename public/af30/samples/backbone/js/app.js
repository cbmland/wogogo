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
        addTodo:function(){

            var val='元素item';
            var imgUrl = 'http://ac-0rg4booz.clouddn.com/53cfcd2314328ec8.jpg?imageView/2/w/200/h/200/q/60/format/jpg';

            todos.push(val);

            $("#todoList").append(this.template({title:val,img:imgUrl}));
        },
        showPhoto:function(e)
        {
            //$('#imgBox').css( "background:url('http://ac-0rg4booz.clouddn.com/53cfcd2314328ec8.jpg') center no-repeat" );
            $('#imgSmall').attr('src',"http://ac-0rg4booz.clouddn.com/53cfcd2314328ec8.jpg?imageView/2/w/200/h/200/q/60/format/jpg");

            $('#imgBig').attr('src','http://ac-0rg4booz.clouddn.com/53cfcd2314328ec8.jpg');
            $.afui.loadContent('#photo',false,false,'pop');
        },
        removeTodo:function(e){
            var item=$(e.target);
            todos.splice(todos.indexOf(item.html()),1);
            $(item).remove();
        },
        initialize:function(){


        }
    });

    $.afui.ready(function(){


        var a= new app();

        a.addTodo();
        a.addTodo();
        a.addTodo();
        a.addTodo();
        a.addTodo();
    });
})(jQuery);