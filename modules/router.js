"use strict";

var URL = require("url"),
	querystring = require("querystring"),
	ejs = require("./ejs.min.js"),
	File = require("./file.js"),
	Utils = require("./utils.js");

/**
 * 路由器
 */
var router = {
	handlers: {},

	filterHandlers: {},

	context: {},

	resourceHandler: null,

	setResourceDir: function (dir) {
		this.resourceHandler = new ResourceHandler(dir);
	},

	register: function (handlers) {
		for (var path in handlers) {
			this.handlers[path] = handlers[path];
		}
	},

	registerFilter: function (handlers) {
		for (var path in handlers) {
			this.filterHandlers[path] = handlers[path];
		}
	},

	route: function (req, resp) {
		var me = this,
			pathInfo = URL.parse(req.url, true),
			path = pathInfo.pathname;

		try {
			var contentLength = req.headers["content-length"] || "0",
				contentType = req.headers["content-type"] ? req.headers["content-type"].split(";")[0] : "";

			if (contentLength != "0" && contentType != "multipart/form-data") {
				// 非文件上传的请求body数据
				var datas = [];
				req.on("data", function (chunk) {
					datas.push(chunk);
				});
				req.on("end", function () {
					req.bodyData = Buffer.concat(datas);
					me._doRoute(req, resp, path);
				});
			} else {
				me._doRoute(req, resp, path);
			}
		} catch (e) {
			Utils.log(e);
		}
	},

	_doRoute: function (req, resp, path) {
		var me = this;

		// 过滤器过滤
		var filterChain = [];
		for (var urlPattern in me.filterHandlers) {
			if (Utils.isMatch(path, urlPattern)) {
				filterChain.push(me.filterHandlers[urlPattern]);
			}
		}
		var filterHandler = new FilterHandler({
			router: me,
			req: req,
			resp: resp,
			filterChain: filterChain
		});
		if (!filterHandler.handle()) {
			return;
		}

		// 处理动态请求，查找匹配的handler
		var handler = null;
		for (var urlPattern in me.handlers) {
			if (Utils.isMatch(path, urlPattern)) {
				handler = me.handlers[urlPattern];
				break;
			}
		}
		if (handler) {
			var actionHandler = new ActionHandler({
				router: me,
				req: req,
				resp: resp,
				handler: handler
			});
			actionHandler.handle();
			return;
		}

		// 处理静态资源
		if (me.resourceHandler && me.resourceHandler.handle(req, resp, path)) {
			return;
		}

		resp.writeHead(404, {
			"Content-Type": "text/html;charset=UTF-8"
		});
		resp.end("<h3>404 Not found.<h3>");
	},

	getContext: function () {
		return this.context;
	}
};


/**
 * 动态请求处理器
 */
var ActionHandler = function (config) {
	this.router = config.router;
	this.req = config.req;
	this.resp = config.resp;
	this.pathInfo = URL.parse(this.req.url, true);
	this.path = this.pathInfo.pathname;
	this.bodyData = this.req.bodyData;

	// url中的参数
	this.params = this.pathInfo.query;
	// 请求body中的参数
	this.bodyParams = this.bodyData ? querystring.parse(this.bodyData.toString()) : {};

	this.handler = config.handler;
};

ActionHandler.prototype = {
	constructor: ActionHandler,

	handle: function () {
		try {
			this.handler.call(this, this.req, this.resp);
		} catch (e) {
			console.log(e);
		}
	},

	getParameter: function (paramName) {
		return this.params[paramName] || this.bodyParams[paramName];
	},

	getBodyAsJson: function () {
		return this.bodyData ? JSON.parse(this.bodyData.toString()) : null;
	},

	getBodyAsText: function (charset) {
		return this.bodyData ? this.bodyData.toString(charest ? charset : "utf8") : null;
	},

	renderHtml: function (tplPath, data) {
		var resp = this.resp,
			html = this.template(tplPath, data);

		resp.writeHead(200, {
			"Content-Type": "text/html;charset=UTF-8"
		});
		resp.end(html);
	},

	renderText: function (content) {
		var resp = this.resp;

		resp.writeHead(200, {
			"Content-Type": "text/plain;charset=UTF-8"
		});
		resp.end(content);
	},

	renderJson: function (data) {
		var resp = this.resp;

		resp.writeHead(200, {
			"Content-Type": "application/json;charset=UTF-8",
		});
		resp.end(typeof data == "string" ? data : JSON.stringify(data));
	},

	redirect: function (url) {
		var resp = this.resp;
		resp.writeHead(301, {
			"Location": url,
			"Cache-Control": "max-age=0"
		});
		resp.end();
	},

	template: function (tplPath, data) {
		var html = null,
			tplFile = new File(tplPath);

		if (tplFile.exists()) {
			var tpl = tplFile.readText();
			// 使用ejs模板引擎生成html
			html = ejs.render(tpl, data);
		} else {
			html = "template[" + tplPath + "] not found.";
		}

		return html;
	},

	getRouterContext: function () {
		return this.router.getContext();
	}
};


/**
 * 静态资源处理器
 */
var ResourceHandler = function (baseDir) {
	this.baseDir = baseDir;
};

ResourceHandler.prototype = {
	constructor: ResourceHandler,

	contentTypes: {
		"html": "text/html",
		"js": "text/javascript",
		"css": "text/css",
		"ico": "text/ico",
		"gif": "image/gif",
		"jpg": "image/jpeg",
		"png": "image/png",
		"json": "application/json",
		"default": "application/octet-stream"
	},

	setBaseDir: function (baseDir) {
		this.baseDir = baseDir;
	},

	handle: function (req, resp, path) {
		var type = path.substring(path.lastIndexOf(".") + 1),
			contentType = this.contentTypes[type] ? this.contentTypes[type] : this.contentTypes["default"];

		var file = new File(this.baseDir + path);
		if (!file.exists()) {
			return false;
		}

		resp.writeHead(200, {
			"Content-Type": contentType
		});
		file.getInputStream().pipe(resp);

		return true;
	}
};


/**
 * 过滤器处理器，继承ActionHandler
 */
var FilterHandler = function (config) {
	ActionHandler.apply(this, arguments);
	// 过滤器处理链
	this.filterChain = config.filterChain;
};
// 通过原型链实现继承
FilterHandler.prototype = Object.create(ActionHandler.prototype);
FilterHandler.prototype.constructor = FilterHandler;

// 重写handle方法
FilterHandler.prototype.handle = function () {
	var me = this,
		req = me.req,
		resp = me.resp,
		filterChain = me.filterChain;

	// 调用过滤链的处理方法
	for (var i = 0; i < filterChain.length; i++) {
		try {
			if (false === filterChain[i].call(me, req, resp)) {
				return false;
			}
		} catch (e) {
			console.log(e);
			return false;
		}
	}

	return true;
};

module.exports = router;