var File = require("./modules/file.js"),
	moment = require("./modules/moment.min.js"),
	PasswordManager = require("./password.js");

module.exports = {
	/**
	 * 初始化密钥
	 */
	"/key/init": function (req, resp) {
		var key = this.getParameter("key");
		try {
			PasswordManager.initKey(key);
			this.renderJson({
				code: 0
			});
		} catch (e) {
			this.renderJson({
				code: -1,
				message: "密钥错误"
			});
		}
	},

	/**
	 * 修改密钥
	 */
	"/password/updateKey": function (req, resp) {
		var key = this.getParameter("key"),
			newKey = this.getParameter("newKey");

		var code = PasswordManager.updateKey(key, newKey);
		this.renderJson({
			code: code,
			message: code == -1 ? "旧密钥错误" : ""
		});
	},

	/** 
	 * 查询
	 */
	"/password/query": function (req, resp) {
		// 请求参数
		var type = this.getParameter("type"),
			content = this.getParameter("content"),
			pageNo = this.getParameter("pageNo"),
			pageSize = this.getParameter("pageSize");

		// 根据查询条件过滤
		var list = PasswordManager.findAll(function (it) {
			if (type && type != it.type) {
				return false;
			}
			if (content && it.title.indexOf(content) == -1) {
				return false;
			}
			return true;
		});

		// 分页
		var startIdx = (pageNo - 1) * pageSize,
			endIdx = pageNo * pageSize,
			resultList = list.slice(startIdx, endIdx < list.length ? endIdx : list.length);

		this.renderJson({
			code: 0,
			data: {
				totalCount: list.length,
				resultList: resultList
			}
		});
	},

	/**
	 * 保存
	 */
	"/password/save": function (req, resp) {
		var json = this.getBodyAsJson();
		// console.log("保存数据：" + JSON.stringify(json));

		if (json.id) {
			// 修改
			var it = PasswordManager.findById(json.id);
			if (it) {
				for (var pname in json) {
					it[pname] = json[pname];
				}
				it.lastUpdated = moment().format("YYYY-MM-DD HH:mm:ss");
			}
		} else {
			// 新增
			json.id = "p_" + new Date().getTime() + parseInt(Math.random() * 1000000);
			json.dateCreated = moment().format("YYYY-MM-DD HH:mm:ss");
			json.lastUpdated = moment().format("YYYY-MM-DD HH:mm:ss");
			PasswordManager.add(json);
		}

		// 持久化数据
		PasswordManager.persist();

		this.renderJson({
			code: 0
		});
	},

	/**
	 * 根据ID查询
	 */
	"/password/get": function (req, resp) {
		var id = this.getParameter("id"),
			data = PasswordManager.findById(id);

		this.renderJson({
			code: 0,
			data: data
		});
	},

	/**
	 * 删除
	 */
	"/password/delete": function (rep, resp) {
		var id = this.getParameter("id");

		// 根据ID删除数据
		PasswordManager.removeById(id);

		// 持久化数据
		PasswordManager.persist();

		this.renderJson({
			code: 0
		});
	}
};