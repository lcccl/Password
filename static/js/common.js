"use strict";

var baseUrl = "";

/* 数据字典 */
var staticData = {
	/* 分类 */
	pwdTypes: {
		"": "请选择",
		"01": "生活",
		"02": "社交",
		"03": "购物",
		"04": "娱乐",
		"05": "游戏",
		"06": "交通",
		"07": "财务",
		"08": "邮箱",
		"09": "开发"
	}
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
			for (var code in data) {
				html += "<option value='" + code + "' " + (code == selectedValue ? "selected" : "") + ">" + data[code] + "</option>";
			}
			el.html(html);
		}
	});
})(jQuery);