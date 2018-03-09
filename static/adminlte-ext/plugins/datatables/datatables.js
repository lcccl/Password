"use strict";

/**
 * 基于jQuery-datatables插件扩展
 */
(function(pluginCtx, $) {
	// 默认配置
	$.extend($.fn.dataTable.defaults, {
		language: {
			"sProcessing": "<div class='dt-processing'>数据正在加载中...</div>",
			"sLengthMenu": "显示 _MENU_ 条",
			"sZeroRecords": "没有匹配结果",
			"sInfo": "第 _PAGE_ 页，共 _TOTAL_ 条记录",
			"sInfoEmpty": "无记录",
			"sInfoFiltered": "(由 _MAX_ 项结果过滤)",
			"sInfoPostFix": "",
			"sSearch": "搜索:",
			"sUrl": "",
			"sEmptyTable": "查询数据为空",
			"sLoadingRecords": "载入中...",
			"sInfoThousands": ",",
			"oPaginate": {
				"sFirst": "首页",
				"sPrevious": "上页",
				"sNext": "下页",
				"sLast": "末页"
			},
			"oAria": {
				"sSortAscending": ": 以升序排列此列",
				"sSortDescending": ": 以降序排列此列"
			}
		},
		dom: 'rt<"bottom"lip>',
		iDisplayLength: 10,
		lengthMenu: [
			[5, 10, 15, 20, 50],
			[5, 10, 15, 20, 50]
		],
		processing: true,
		searching: false, // 禁用原生搜索
		ordering: false, // 禁用排序
		pagingType: "full_numbers" // full_numbers包含首页、末页
	});


	/**
	 * 扩展的datatables组件，返回datatables组件的API实例
	 * 扩展了API实例，增加了reload方法，动态获取服务端数据，参数同jQuery的ajax方法；
	 * 参数说明：
	 *   1.存在opts时，初始化datatables组件，返回API实例；
	 *   2.无参数时，返回API实例；
	 */
	$.fn.dataTables = function(opts) {
		if (opts) {
			// 创建扩展上下文
			var extContext = {};

			// 初始化配置项
			opts = initOptions(opts, extContext);

			// 保存扩展上下文
			this.data("extContext", extContext);
			this.each(function() {
				$(this).data("extContext", extContext);
			});

			// 扩展初始化
			initExt(this, opts, extContext);
		}

		var api = this.dataTable(opts).api();
		// 扩展API实例
		extendApi(api, this.data("extContext"));

		return api;
	};

	// 扩展的初始化参数名
	var extParamNames = ["queryType", "queryUrl", "queryData", "columnFields"];

	/**
	 * 初始化配置项
	 */
	var initOptions = function(opts, extContext) {
		// 处理配置参数
		var config = {};
		for (var key in opts) {
			var val = opts[key];
			if ($.inArray(key, extParamNames) != -1) {
				// 保存扩展参数
				extContext[key] = val;
			} else {
				config[key] = val;
			}
		}

		/**
		 * 根据字段列表构造columns配置，简化了原本的columns配置，columnFields中的元素可以为字符串或对象
		 *   字符串：字段名，自动构造成column标准的配置项；
		 *   对象：column标准的配置项；
		 */
		if (!config.columns && opts.columnFields) {
			config.columns = [];
			$.each(opts.columnFields, function(idx, it) {
				if (typeof it == "string") {
					config.columns.push({
						data: it
					});
				} else if (typeof it == "object") {
					config.columns.push(it);
				}
			});
		}

		// 修复coloumns，设置默认defaultContent防止缺失字段报错
		$.each(config.columns, function(idx, it) {
			it.defaultContent = undefined == it.defaultContent ? "" : it.defaultContent;
		});

		// 追加首列
		if (opts.indexColumn || opts.selectionType) {
			// 生成列字段名
			var fieldName = "dtc_" + parseInt(Math.random() * 100000000);
			config.columns.splice(0, 0, {
				data: fieldName,
				render: function(data, type, row, meta) {
					var html = "<label class='" + (opts.selectionType ? opts.selectionType : "") + "'>";
					// 增加选择框，复选框或单选框
					if (opts.selectionType == "checkbox") {
						html += "<input type='checkbox' name='chk_" + (fieldName + "_" + meta.row) + "' />";
					} else if (opts.selectionType == "radio") {
						html += "<input type='radio' name='rd_" + fieldName + "' />";
					}
					// 增加序号
					if (opts.indexColumn) {
						html += (meta.row + 1);
					}
					html += "</label>";
					return html;
				}
			});
		}

		if (config.serverSide) {
			// 请求服务端获取数据
			config.ajax = function(data, callback, settings) {
				var queryType = extContext.queryType,
					queryUrl = extContext.queryUrl,
					queryParams = extContext.queryParams;

				// 渲染返回数据
				var renderReturnData = function(resp) {
					callback({
						draw: data.draw,
						recordsTotal: resp ? resp.totalCount : 0,
						recordsFiltered: resp ? resp.totalCount : 0,
						data: resp ? resp.resultList : []
					});
				};

				if (queryUrl) {
					// 进行ajax查询
					var params = $.extend({
						pageSize: data.length,
						pageNo: (data.start / data.length) + 1
					}, queryParams);

					$.ajax({
						type: queryType,
						url: queryUrl,
						data: params,
						cache: false,
						dataType: "json",
						success: function(resp) {
							if (resp.code == 0) {
								renderReturnData(resp.data);
							} else {
								renderReturnData();
								showError(resp.message);
							}
						},
						error: function(xhr, status, err) {
							renderReturnData();
							showError(xhr.responseText || err || status);
						}
					});
				} else {
					// 未设置url，返回空的结果集
					renderReturnData();
				}
			};
		}

		return config;
	};

	/**
	 * 扩展datatables的API实例
	 */
	var extendApi = function(api, extContext) {
		$.extend(api, {
			extContext: extContext,

			/**
			 * 重新加载数据
			 */
			reload: function(params) {
				var extContext = this.extContext;

				// 更新查询参数
				if (params) {
					extContext.queryType = params.type || extContext.queryType;
					extContext.queryUrl = params.url || extContext.queryUrl;
					extContext.queryParams = params.data || extContext.queryParams;
				}

				this.draw();
			}
		});
	};

	/**
	 * 扩展初始化
	 */
	var initExt = function(el, opts, extContext) {
		// 行选中样式
		$("tbody", el).on("click", "tr", function() {
			$(this).addClass("selected").siblings().removeClass("selected");
		});

		// 复选框全选/全部取消
		$("th .selectAll input[type='checkbox']", el).on("change", function() {
			$("td .checkbox input[type='checkbox']", el).prop("checked", $(this).prop("checked"));
		});
	};

	/**
	 * 显示错误消息
	 */
	var showError = function(errMsg) {
		if (pluginCtx.MsgBox) {
			pluginCtx.MsgBox.error(errMsg);
		} else if (window.console) {
			console.log(errMsg);
		} else {
			alert(errMsg);
		}
	};
})(window, jQuery);