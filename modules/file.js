"use strict";

/**
 * 文件抽象，封装fs，提供文件操作的常用方法
 */
var File = function(path, fileName) {
	this.fs = require("fs");
	this.path = fileName ? path + "/" + fileName : path;
	this.fileName = fileName ? fileName : path.substring(path.lastIndexOf("/") + 1);
	if (this.exists()) {
		this.stat = this.fs.statSync(this.path);
	}
};

File.prototype = {
	constructor: File,

	getType: function() {
		return this.path.substring(this.path.lastIndexOf(".") + 1);
	},

	readText: function(charset) {
		return this.fs.readFileSync(this.path, charset ? charset : "utf-8");
	},

	writeText: function(text, charset) {
		this.fs.writeFileSync(this.path, text, charset ? charset : "utf-8");
	},

	exists: function() {
		return this.fs.existsSync(this.path);
	},

	isFile: function() {
		return this.stat.isFile();
	},

	isDir: function() {
		return this.stat.isDirectory();
	},

	mkdir: function() {
		this.fs.mkdirSync(this.path);
	},

	getInputStream: function() {
		return this.fs.createReadStream(this.path);
	},

	getOutputStream: function() {
		return this.fs.createWriteStream(this.path);
	},

	eachFiles: function(callback) {
		var me = this;
		me.fs.readdirSync(me.path).forEach(function(fileName) {
			var f = new File(me.path, fileName);
			callback(f);
		});
	},

	copyTo: function(destPath, callback) {
		var me = this;

		if (me.isDir()) {
			var destDir = new File(destPath);
			if (!destDir.exists()) {
				destDir.mkdir();
			}

			me.eachFiles(function(f) {
				f.copyTo(destDir.path + "/" + f.fileName, callback);
			});

			if (callback) {
				callback(me, destDir);
			}
		} else {
			var readSteam = me.fs.createReadStream(me.path),
				writeStream = me.fs.createWriteStream(destPath);
			readSteam.pipe(writeStream);

			writeStream.on("close", function() {
				if (callback) {
					callback(me, new File(destPath));
				}
			});
		}
	},

	delete: function() {
		var me = this;

		if (me.isDir()) {
			me.eachFiles(function(file) {
				file.delete();
			});
			me.fs.rmdirSync(me.path);
		} else {
			me.fs.unlinkSync(me.path);
		}
	}
};

module.exports = File;