"use strict";

/**
 * 基于bootstrap-modal扩展的消息框组件
 */
(function(pluginCtx, $) {
	// 消息框的html基础结构模板
	var htmlTpl = "";
	htmlTpl += '<div class="modal fade" style="display: none;">';
	htmlTpl += '<div class="modal-dialog">';
	htmlTpl += '<div class="modal-content modal-msgbox">';
	htmlTpl += '<div class="modal-header">';
	htmlTpl += '<button type="button" class="close close-btn" aria-label="Close"><span aria-hidden="true">×</span></button>';
	htmlTpl += '<i class="modal-icon"></i><h4 class="modal-title"></h4>';
	htmlTpl += '</div>';
	htmlTpl += '<div class="modal-body">';
	htmlTpl += '</div>';
	htmlTpl += '<div class="modal-footer">';
	htmlTpl += '</div>';
	htmlTpl += '</div>';
	htmlTpl += '</div>';
	htmlTpl += '</div>';

	/** 
	 * 消息框组件
	 */
	var MsgBox = function(params) {
		this.params = $.extend({}, params);
		this.events = $.extend({}, params.events);
		// 附加数据
		this.extData = $.extend({}, params.extData);
		this.init();
	};

	MsgBox.prototype = {
		constructor: MsgBox,

		init: function() {
			var me = this,
				params = me.params;

			var box = $(htmlTpl);
			// 模态框增加ID
			box.attr("id", new Date().getTime() + "_" + parseInt(Math.random() * 1000000));
			// 设置模态框主题样式
			$(".modal-content", box).addClass(params.theme || "");
			// 设置标题
			$(".modal-title", box).text(params.title);
			// 设置内容
			$(".modal-body", box).html(params.content);
			// 设置宽度
			if (params.width) {
				$(".modal-dialog", box).css("width", params.width);
			}

			// 设置按钮
			var footer = $(".modal-footer", box);
			if (params.buttons) {
				$.each(params.buttons, function(idx, cfg) {
					var clazz = cfg.clazz ? cfg.clazz : 'btn-default',
						label = cfg.label,
						btn = $('<button type="button" class="btn ' + clazz + '">' + label + '</button>');

					// 按钮绑定事件
					if (cfg.callback) {
						btn.on("click", function(e) {
							cfg.callback.call(me, box, btn, e);
						});
					}

					footer.append(btn);
				});
			} else {
				footer.remove();
			}

			// 关闭按钮绑定事件
			box.on("click", ".close-btn", function() {
				me.close();
			});
			// 模态框绑定关闭事件
			box.on("hidden.bs.modal", function(e) {
				me.dispose();
			});

			box.appendTo(document.body);

			me.box = box;
		},

		show: function(opts) {
			var me = this,
				box = me.box,
				params = me.params,
				events = me.events;

			opts = $.extend({}, opts);

			if (opts.content) {
				$(".modal-body", box).html(opts.content);
			}

			if (events.onShow && $.isFunction(events.onShow)) {
				events.onShow.call(me, box);
			}

			box.modal({
				backdrop: opts.backdrop || params.backdrop || "static"
			});

			// 加入队列
			MsgBox.boxQueue.push(me);
		},

		close: function() {
			var me = this,
				box = me.box,
				events = me.events;

			if (events.onClose && $.isFunction(events.onClose)) {
				events.onClose.call(me, box);
			}

			box.modal("hide");

			// 移出队列
			for (var i = 0; i < MsgBox.boxQueue.length; i++) {
				if (MsgBox.boxQueue[i] == me) {
					MsgBox.boxQueue.splice(i, 1);
					break;
				}
			}
		},

		dispose: function() {
			this.box.removeData("bs.modal");
			this.box.remove();
		},

		data: function(name, value) {
			if (arguments.length == 2) {
				this.extData[name] = value;
			} else {
				return this.extData[name];
			}
		}
	};

	$.extend(MsgBox, {
		/* 当前显示的消息框队列 */
		boxQueue: [],

		info: function(msg) {
			return this.alert({
				title: "提示",
				theme: "modal-theme-info",
				msg: msg
			});
		},

		warn: function(msg) {
			return this.alert({
				title: "警告",
				theme: "modal-theme-warn",
				msg: msg
			});
		},

		error: function(msg) {
			return this.alert({
				title: "错误",
				theme: "modal-theme-error",
				msg: msg
			});
		},

		/**
		 * 弹出消息提示框
		 * 参数说明：
		 *   title：弹出框标题；
		 *   theme：弹出框主题样式，该样式会被添加到<div class="modal-content modal-msgbox">节点处；
		 *   msg：消息；
		 *   events：事件处理函数，例如：onShow、onHide等；
		 */
		alert: function(params) {
			var box = new MsgBox({
				title: params.title,
				theme: params.theme || "",
				content: "<p>" + params.msg + "</p>",
				buttons: [{
					clazz: "close-btn btn-primary",
					label: "确定"
				}],
				events: params.events
			});
			box.show();

			return box;
		},

		/**
		 * 弹出消息确认框
		 * 参数说明：
		 *   msg：提示信息；
		 *   okCallback：点击确定回调函数；
		 *   cancelCallback：点击取消回调函数；
		 *   events：事件处理函数，例如：onShow、onHide等；
		 */
		confirm: function(msg, okCallback, cancelCallback, events) {
			var box = new MsgBox({
				title: "确认信息",
				theme: "modal-theme-confirm",
				content: "<p>" + msg + "</p>",
				buttons: [{
					clazz: "close-btn btn-primary",
					label: "确定",
					callback: okCallback
				}, {
					clazz: "close-btn btn-default",
					label: "取消",
					callback: cancelCallback
				}],
				events: events
			});
			box.show();

			return box;
		},

		/**
		 * 打开弹出模态框页面，页面通过ajax后台加载或者指定html代码；
		 * 参数说明：
		 *   title：弹出框标题；
		 *   theme：弹出框主题样式，该样式会被添加到<div class="modal-content modal-msgbox">节点处；
		 *   content：加载指定html代码；
		 *   type/url/data：ajax请求后台的参数，同jQuery的ajax；
		 *   iframe：通过内嵌iframe加载；
		 *   buttons：按钮配置，为一个数组，每个按钮可以配置样式、标题、点击的回调函数；
		 *   events：事件处理函数，例如：onShow、onHide等；
		 */
		open: function(params) {
			var me = this;

			params = $.extend({}, params);
			if (params.iframe) {
				params.content = "<iframe class='modal-msgbox-iframe' src='" + params.url + "'" +
					(params.iframeHeight ? " height='" + params.iframeHeight + "'" : "") + "></iframe>";
			}

			if (params.content) {
				// 加载指定html页面
				var box = new MsgBox(params);
				box.show();
			} else if (params.url) {
				// 请求后台加载动态页面
				$.ajax({
					type: params.type,
					url: params.url,
					data: params.data,
					cache: false,
					showLoading: true,
					success: function(resp) {
						var data = parseJSON(resp);
						if (typeof data == "string") {
							var box = new MsgBox(params);
							box.show({
								content: resp
							});
						} else {
							me.error(data.message);
						}
					},
					error: function(xhr, status, err) {
						me.error(xhr.responseText || err || status);
					}
				});
			}
		},

		getCurrentBox: function() {
			return this.boxQueue[this.boxQueue.length - 1];
		},

		closeCurrentBox: function() {
			this.getCurrentBox().close();
		}
	});

	var parseJSON = function(data) {
		if (typeof data == "string") {
			try {
				return $.parseJSON(data);
			} catch (e) {
				return data;
			}
		} else {
			return data;
		}
	};

	pluginCtx.MsgBox = MsgBox;
})(window, jQuery);