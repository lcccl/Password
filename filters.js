var PasswordManager = require("./password.js"),
	Utils = require("./modules/utils.js");

module.exports = {
	"/pages/passwordList.html": function (req, resp) {
		var code = PasswordManager.check();
		if (code != 0) {
			this.renderJson({
				code: code
			});
			return false;
		}
	},

	"/password/*": function (req, resp) {
		var code = PasswordManager.check();
		if (code != 0) {
			Utils.log("拦截请求：" + this.path);
			this.renderJson({
				code: code,
				message: code == -1 ? "密码文件未创建" : "未输入加密密钥"
			});
			return false;
		}
	}
};