"use strict";

(function(ctx, $) {
	/**
	 * 定义公共的全局命名空间，提供常用的方法
	 */
	var AdminExt = {
		/**
		 * 提供一个封闭的函数执行环境，函数执行时默认提供参数ctx、$
		 */
		evaluate: function(fn) {
			return fn.call(this, ctx, $);
		},

		/**
		 * 获取url中的参数
		 */
		getUrlParam: function(name, win) {
			win = win || window;
			// 首次调用时解析请求参数并缓存
			if (!win._urlParams) {
				win._urlParams = {};
				var queryString = win.location.search.substring(1),
					paramArray = queryString.split("&");
				for (var i = 0; i < paramArray.length; i++) {
					var param = paramArray[i],
						idx = param.indexOf("=");
					if (idx != -1) {
						var key = param.substring(0, idx),
							val = decodeURIComponent(param.substring(idx + 1));
						win._urlParams[key] = val;
					}
				}
			}

			return win._urlParams[name];
		}
	};

	ctx.AdminExt = AdminExt;
})(window, jQuery);


/**
 * jQuery扩展
 */
AdminExt.evaluate(function(ctx, $) {
	/**
	 * jQuery原型扩展
	 */
	$.extend($.fn, {
		/**
		 * 修复jquery的serializeArray方法不会处理disabled元素的bug
		 */
		serializeAllArray: function() {
			var obj = {};
			$('input', this).each(function() {
				if ($(this).attr("type") == "checkbox" || $(this).attr("type") == "radio") {
					if ($(this).is(":checked")) {
						obj[this.name] = $(this).val();
					} else {
						if ($(this).attr("type") == "checkbox") {
							obj[this.name] = "";
						}
					}
				} else {
					obj[this.name] = $(this).val();
				}
			});
			$('select', this).each(function() {
				obj[this.name] = $(this).val();
			});
			return obj;
		},

		/**
		 * 修复jquery的serialize方法不会处理disabled元素的bug
		 */
		serializeAll: function() {
			var obj = this.serializeAllArray();
			return $.param(obj);
		},

		/**
		 * 获取元素的坐标（相对偏移量）
		 */
		getPosition: function() {
			var el = this,
				offset = el.offset(),
				top = offset.top,
				left = offset.left;

			// 根据父容器调整偏移量坐标
			while (el[0] != el.offsetParent()[0]) {
				el = el.offsetParent();
				offset = el.offset();
				if (top < offset.top || left < offset.left) {
					break;
				}

				top = top - offset.top;
				left = left - offset.left;
			}

			return {
				x: left,
				y: top
			};
		}
	});


	/*========================= ajax请求增加加载中的动画效果 - begin =========================*/
	var Loading = {
		showLoading: function() {
			var el = $("#loading-mask");
			if (!el[0]) {
				el = $("<div id='loading-mask' class='loading-mask'><span></span></div>");
				el.appendTo(document.body);
			}
			el.show();
		},

		hideLoading: function() {
			var el = $("#loading-mask");
			if (el[0]) {
				el.hide();
			}
		}
	};

	var _ajaxFunc = $.ajax;

	/**
	 * 重写jQuery的ajax方法
	 * 增加参数：
	 *   shwoLoading：为true时，显示加载动画，默认不显示
	 */
	$.ajax = function(opts) {
		if (opts.showLoading) {
			// 请求前显示加载动画
			var beforeSend = opts.beforeSend;
			opts.beforeSend = function() {
				Loading.showLoading();

				if (beforeSend && $.isFunction(beforeSend)) {
					beforeSend.apply(this, arguments);
				}
			};

			// 请求完成后关闭加载动画
			var complete = opts.complete;
			opts.complete = function() {
				Loading.hideLoading();

				if (complete && $.isFunction(complete)) {
					complete.apply(this, arguments);
				}
			};
		}

		return _ajaxFunc.call(this, opts);
	};

	ctx.Loading = Loading;
	/*========================= ajax请求增加加载中的动画效果 - end =========================*/
});


/**
 * 扩展jQuery validation
 */
AdminExt.evaluate(function(ctx, $) {
	/**
	 * 默认的校验，替代validate方法，定制化错误提示框的位置和提示信息
	 */
	$.fn.defaultValidate = function(config) {
		var form = this,
			defaultPlacement = form.attr("error-placement") ? form.attr("error-placement") : "bottom";

		return this.validate({
			errorElement: "div",
			errorClass: "error error-tip",
			showErrors: function(errorMap, errorList) {
				this.defaultShowErrors();

				// 定制化错误提示框
				for (var i = 0; i < errorList.length; i++) {
					var error = errorList[i],
						el = $(error.element),
						message = error.message,
						errTip = el.nextAll("div.error.error-tip"),
						placement = el.attr("error-placement") ? el.attr("error-placement") : defaultPlacement;

					// 设置提示信息
					message = message.replace(/{otitle}/g, (el.attr("otitle") ? el.attr("otitle") : ""));
					errTip.html(message);

					// 设置提示框的位置样式
					var pos = {},
						_pos = el.getPosition(),
						x = _pos.x,
						y = _pos.y;
					if (placement == "top") {
						pos.top = y - errTip.outerHeight(true) * 0.85;
						pos.left = x + (el.width() - errTip.outerWidth(true)) / 2;
					} else if (placement == "right") {
						pos.top = y + (el.outerHeight(true) - errTip.height()) / 2;
						pos.left = x + el.width() * 0.85;
					} else if (placement == "bottom") {
						pos.top = y + el.outerHeight(true) * 0.85;
						pos.left = x + (el.width() - errTip.outerWidth(true)) / 2;
					} else if (placement == "left") {
						pos.top = y + (el.outerHeight(true) - errTip.height()) / 2;
						pos.left = x - errTip.outerWidth(true) * 0.9;
					}
					errTip.css(pos);
					errTip.addClass("arrow-" + placement);
				}
			},
			errorPlacement: function errorPlacement(error, element) {
				element.after(error);
			}
		});
	};
});