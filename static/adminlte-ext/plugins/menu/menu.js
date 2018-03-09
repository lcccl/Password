"use strict";

(function($) {
	/**
	 * 弹出菜单插件
	 * 参数说明：
	 *   multi：是否允许弹出多个菜单；
	 *   theme：菜单主题样式；
	 *   trigger：触发弹出菜单的事件，例如:：click、mouseleft、mouseright；
	 *   menus：菜单配置，是一个数组，具体配置项说明：
	 *     text：菜单项显示内容；
	 *     render：自定义渲染函数；
	 *     handler：点击菜单项的处理函数；
	 */
	var ContextMenu = function(opts) {
		var el = this;

		opts = $.extend({
			trigger: "mouseright"
		}, opts);

		// 处理事件名，mouseleft、mouseright对应的事件为mouseup
		var eventName = opts.trigger;
		if (eventName == "mouseleft" || eventName == "mouseright") {
			eventName = "mouseup";
		}

		// 屏蔽浏览器鼠标右键菜单
		if (opts.trigger == "mouseright") {
			el.on("contextmenu", function(event) {
				event.preventDefault();
			});
		}

		// 绑定弹出菜单事件
		el.on(eventName, function(event) {
			if (opts.trigger == "mouseleft" && event.which != 1) {
				return;
			}
			if (opts.trigger == "mouseright" && event.which != 3) {
				return;
			}

			event.stopPropagation();

			opts.x = event.clientX;
			opts.y = event.clientY;

			new Menu(opts);
		});
	};

	/**
	 * 弹出菜单
	 */
	var Menu = function(config) {
		config = $.extend({}, config);
		this.multi = config.multi;
		this.init(config);

		// 不允许弹出多个菜单时，关闭当前菜单
		if (!this.multi) {
			if (Menu.single) {
				Menu.single.close();
			}
			Menu.single = this;
		}

		this.show();
	};

	Menu.prototype = {
		constructor: Menu,

		init: function(config) {
			var me = this,
				theme = config.theme,
				menus = config.menus;

			// 创建菜单
			var el = $("<div class='ui-context-menu'><ul></ul></div>"),
				ul = $("ul", el);
			$.each(menus, function(idx, cfg) {
				var html = "<li>" + (cfg.render ? cfg.render() : cfg.text) + "</li>",
					li = $(html);
				li.on("click", function(e) {
					e.stopPropagation();
					if (cfg.handler) {
						cfg.handler.call(me, el, li, e);
					}
					me.close();
				});
				ul.append(li);
			});

			if (theme) {
				el.addClass(theme);
			}
			el.css({
				left: config.x,
				top: config.y
			});
			$(document.body).append(el);
			me.el = el;
		},

		show: function() {
			var el = this.el;
			// 弹出框样式包含z-index时，必须延迟执行，否则会导致右键屏蔽的事件传播受阻
			setTimeout(function() {
				el.fadeIn(100);
			}, 50);
		},

		close: function() {
			this.el.hide();
			this.el.remove();

			if (!this.multi) {
				Menu.single = null;
			}
		}
	};

	// 点击空白处，关闭弹出菜单（允许多个的菜单不关闭）
	$(document.body).on("click", function(event) {
		if (Menu.single) {
			var target = $(event.target).parents(".ui-context-menu");
			if (target[0] != Menu.single.el[0]) {
				Menu.single.close();
			}
		}
	});

	ContextMenu.Menu = Menu;
	$.fn.contextMenu = ContextMenu;
})(jQuery);