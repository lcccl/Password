"use strict";

/**
 * 进程管理器
 */
var ProcessManager = {

	platform: process.platform,

	childProcess: require("child_process"),

	/**
	 * 根据占用的端口获取进程pid
	 */
	findPidByPort: function(port) {
		var cmdConfig = {
			"win32": {
				cmd: 'netstat -ano|findstr "' + port + '"',
				handler: function(line) {
					return line.substring(line.lastIndexOf(" ") + 1);
				}
			},

			"default": {
				cmd: 'lsof -i:' + port,
				handler: function(line) {
					line = line.substring(line.indexOf(" ")).trim();
					return line.substring(0, line.indexOf(" "));
				}
			}
		};

		var cfg = cmdConfig[this.platform] ? cmdConfig[this.platform] : cmdConfig["default"],
			cmd = cfg.cmd,
			handler = cfg.handler;

		// 执行命令，并解析结果
		var stdout = this.execSync(cmd).toString().trim(),
			lines = stdout.split("\n"),
			pids = [];
		for (var i = 0; i < lines.length; i++) {
			var line = lines[i].trim();
			if (line.length > 0) {
				var p = handler(line);
				if (pids.indexOf(p) == -1) {
					pids.push(p);
				}
			}
		}

		return pids;
	},

	/**
	 * 根据占用的端口kill进程
	 */
	killByPort: function(port) {
		var pids = this.findPidByPort(port);
		for (var i = 0; i < pids.length; i++) {
			this.kill(pids[i]);
		}
	},

	/**
	 * kill进程
	 */
	kill: function(pid) {
		var cmd = this.platform == "win32" ? ("taskkill /pid " + pid + " -t -f") : ("kill -9 " + pid);
		this.execSync(cmd);
	},

	exec: function() {
		return this.childProcess.exec.apply(this.childProcess, arguments);
	},

	execSync: function() {
		// 命令执行退出码不为0时会抛异常，所以包在try...catch里
		try {
			return this.childProcess.execSync.apply(this.childProcess, arguments);
		} catch (e) {
			return new Buffer("");
		}
	},

	spawn: function() {
		return this.childProcess.spawn.apply(this.childProcess, arguments);
	},

	spawnSync: function() {
		return this.childProcess.spawnSync.apply(this.childProcess, arguments);
	}
};

module.exports = ProcessManager;