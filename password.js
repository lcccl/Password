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
    },

    export: function (type, path) {
        ExportFactory.export(type, path, this.jsonList);
    },

    import: function (type, path) {
        this.jsonList = ExportFactory.import(type, path);
    }
};

// 密码类型字典数据
var PwdTypes = (function () {
    var codeData = {},
        textData = {},
        list = [{
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
        }];
    for (var i = 0; i < list.length; i++) {
        var it = list[i];
        codeData[it.code] = it.text;
        textData[it.text] = it.code;
    }

    return {
        getText: function (code) {
            return codeData[code];
        },
        getCode: function (text) {
            return textData[text];
        }
    };
})();


/**
 * 导入导出工厂
 */
var ExportFactory = {
    /* 导出方法 */
    exportMethods: {
        "JSON": function (path, data) {
            new File(path).writeText(JSON.stringify(data));
        },

        "MD": function (path, data) {
            var text = "";
            for (var i = 0; i < data.length; i++) {
                var obj = data[i];
                text += "#### " + obj.title + "\n";
                text += "- 分类：" + PwdTypes.getText(obj.type) + "\n";
                text += "- 描述：" + obj.description + "\n";
                if (obj.extItems && obj.extItems.length > 0) {
                    for (var j = 0; j < obj.extItems.length; j++) {
                        var item = obj.extItems[j];
                        text += "- " + item.name + "：" + item.value + "\n";
                    }
                }
                // text += "- 创建时间：" + obj.dateCreated + "\n";
                // text += "- 修改时间：" + obj.lastUpdated + "\n";

                if (i < data.length - 1) {
                    text += "\n---\n<br/>\n\n";
                }
            }

            new File(path).writeText(text);
        }
    },

    /* 导入方法 */
    importMethods: {
        "JSON": function (path) {
            var file = new File(path);
            if ("json" != file.getType()) {
                throw {
                    code: 500,
                    type: "json"
                };
            }
            var text = file.readText();
            return JSON.parse(text);
        },

        "MD": function (path) {
            var file = new File(path);
            if ("md" != file.getType()) {
                throw {
                    code: 500,
                    type: "md"
                };
            }
            var text = file.readText(),
                lines = text.split("\n"),
                jsonList = [],
                obj = null;

            // 逐行解析md文档，每个密码记录以#### 开始，--- 结束
            for (var i = 0; i < lines.length; i++) {
                var line = lines[i].trim();
                if (line.indexOf("#### ") == 0) {
                    obj = {
                        id: new Date().getTime() + "_" + Math.round(Math.random() * 100000),
                        title: line.substring(5).trim(),
                        extItems: []
                    };
                    jsonList.push(obj);
                } else if (line.indexOf("---") == 0) {
                    // console.log("=====> " + JSON.stringify(obj));
                    obj = null;
                } else if (obj && line.indexOf("- ") == 0) {
                    line = line.substring(2);
                    var idx = line.indexOf("：") || line.indexOf(":"),
                        name = line.substring(0, idx).trim(),
                        value = line.substring(idx + 1).trim();
                    if (name == "分类") {
                        obj.type = PwdTypes.getCode(value);
                    } else if (name == "描述") {
                        obj.description = value;
                    } else if (name == "创建时间") {
                        obj.dateCreated = value;
                    } else if (name == "修改时间") {
                        obj.lastUpdated = value;
                    } else {
                        obj.extItems.push({
                            name: name,
                            value: value
                        });
                    }
                }
            }

            return jsonList;
        }
    },

    export: function (type, path, data) {
        this.exportMethods[type].call(this, path, data);
    },

    import: function (type, path) {
        return this.importMethods[type].call(this, path);
    }
};

module.exports = PasswordManager;