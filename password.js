"use strict";

var File = require("./modules/file.js"),
    Utils = require("./modules/utils.js");

/**
 * 密码管理器
 */
var PasswordManager = {
    jsonFile: null,

    jsonList: null,

    initPath: function (path) {
        this.path = path || "password.json";
        this.jsonFile = new File(this.path);
    },

    initKey: function (key) {
        if (!this.exists()) {
            this.jsonFile.writeText(Utils.encryptAES("[]", key));
        }

        this.jsonList = JSON.parse(Utils.decryptAES(this.jsonFile.readText(), key));
        this.key = key;
    },

    /**
     * 检测状态，0：正常、-1：json文件不存在、1：未解密
     */
    check: function () {
        if (!this.exists()) {
            return -1;
        }
        if (!this.key || !this.jsonList) {
            return 1;
        }

        return 0;
    },

    updateKey: function (key, newKey) {
        if (this.key != key) {
            return -1;
        }

        this.key = newKey;
        this.persist();
        return 0;
    },

    exists: function () {
        return this.jsonFile && this.jsonFile.exists();
    },

    persist: function () {
        this.jsonFile.writeText(Utils.encryptAES(JSON.stringify(this.jsonList), this.key));
    },

    findById: function (id) {
        return this.find(function (it) {
            return it.id == id;
        });
    },

    find: function (callback) {
        for (var i = 0; i < this.jsonList.length; i++) {
            var it = this.jsonList[i];
            if (callback(it)) {
                return it;
            }
        }
    },

    findAll: function (callback) {
        var list = [];
        for (var i = 0; i < this.jsonList.length; i++) {
            var it = this.jsonList[i];
            if (callback(it)) {
                list.push(it);
            }
        }
        return list;
    },

    add: function (json) {
        this.jsonList.unshift(json);
    },

    remove: function (json) {
        this.removeById(json.id);
    },

    removeById: function (id) {
        for (var i = 0; i < this.jsonList.length; i++) {
            var it = this.jsonList[i];
            if (it.id == id) {
                this.jsonList.splice(i, 1);
                break;
            }
        }
    }
};

module.exports = PasswordManager;