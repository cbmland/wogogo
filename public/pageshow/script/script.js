



	var webRoot = "./";
	$.ui.autoLaunch = false; //控制是否自动初始化
	
	var init = function init() {//初始化执行
		$.ui.launch();
	};
	
	document.addEventListener("DOMContentLoaded", init, false);
	
	

	//滚动到底部自动加载新的数据
		var myScroller;
		$.ui.ready(function () {
		
			myScroller = $("#webslider").scroller(); 

			myScroller.addInfinite();

			$.bind(myScroller, "infinite-scroll", function () {
				$.ui.showMask("正在载入新内容");
				var self = this;

				$.bind(myScroller, "infinite-scroll-end", function () {
					$.unbind(myScroller, "infinite-scroll-end");
					
					//加载数据写到里面。和点击按钮加载更多差不多就ok

					setTimeout(function () {//这里只是模拟一下正在载入的状态

						self.clearInfinite();
						$(self.el).append("<p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p><p>aaaaaaa</p>");

						$.ui.hideMask("新内容载入完毕");
					}, 2000);
					
					
				});
			});

		});
		
		
		
	