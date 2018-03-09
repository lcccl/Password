var http = require("http"),
	router = require("./modules/router.js"),
	Utils = require("./modules/utils.js"),
	PasswordManager = require("./password.js"),
	httpPort = 10088;

// 设置静态资源目录
router.setResourceDir("static");
// 注册请求映射
router.register(require("./handlers.js"));
// 注册过滤器
router.registerFilter(require("./filters.js"));

// 初始化密码管理器，设置密码文件路径
PasswordManager.initPath("password.json");

http.createServer(function (req, resp) {
	router.route(req, resp);
}).listen(httpPort);

Utils.log("Server running at Http://127.0.0.1:" + httpPort + "/");

require("child_process").exec("start http://127.0.0.1:" + httpPort + "/index.html");