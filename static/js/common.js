"use strict";

var baseUrl = "";

/* 数据字典 */
var staticData = {
	/* 分类 */
	pwdTypes: [{
		code: "",
		text: "请选择"
	}, {
		code: "01",
		text: "生活"
	}, {
		code: "02",
		text: "社交"
	}, {
		code: "03",
		text: "购物"
	}, {
		code: "04",
		text: "娱乐"
	}, {
		code: "05",
		text: "游戏"
	}, {
		code: "06",
		text: "交通"
	}, {
		code: "07",
		text: "财务"
	}, {
		code: "08",
		text: "邮箱"
	}, {
		code: "09",
		text: "开发"
	}, {
		code: "10",
		text: "支付"
	}]
};


/**
 * jQuery扩展
 */
(function ($) {
	var parseJSON = function (data) {
		try {
			return $.parseJSON(data);
		} catch (e) {
			return data;
		}
	};

	$.extend($.fn, {
		/**
		 * ajax请求后台加载页面
		 */
		ajaxUrl: function (params) {
			var el = $(this);

			$.ajax({
				type: params.type ? params.type : "GET",
				url: params.url,
				data: params.data,
				success: function (resp) {
					var data = parseJSON(resp);
					if (typeof data == "string") {
						el.html(data);
					} else {
						if (params.error) {
							params.error(data);
						} else {
							MsgBox.error(data);
						}
					}
				},
				error: function (xhr, status, err) {
					MsgBox.error(xhr.responseText || err || status);
				}
			});
		},

		/** 
		 * 设置下拉框数据
		 */
		setSelectData: function (data, selectedValue) {
			var el = $(this),
				html = "";
			for (var i = 0; i < data.length; i++) {
				var it = data[i];
				html += "<option value='" + it.code + "' " + (it.code == selectedValue ? "selected" : "") + ">" + it.text + "</option>";
			}
			el.html(html);
		}
	});
})(jQuery);