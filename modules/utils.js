"use strict";

var moment = require("./moment.min.js"),
	crypto = require("crypto");

/**
 * 通用工具集
 */
var Utils = {

	/**
	 * 输出带时间前缀的日志
	 */
	log: function (msg) {
		console.log("[" + moment().format("YYYY-MM-DD HH:mm:ss") + "] " + msg);
	},

	/** 
	 * 字符串通配符匹配
	 * 采用动态规划，将匹配问题转换成一个矩阵，纵轴代表含有通配符的匹配字符串pattern，横轴代表待匹配的字符串str，T：true、F：false
	 * 例如：pattern=a*b，str=abc，转换为矩阵如下：
	 * ---------------------
	 * |   |   | a | b | c |
	 * |   | T | F | F | F |
	 * | a | F |   |   |   |
	 * | * | F |   |   |   |
	 * | b | F |   |   |   |
	 * ---------------------
	 * 矩阵增加一行、一列，作为初始值，计算矩阵每个位置的值，最后取右下角的值即为匹配结果
	 * 计算规则：
	 *     1、纵轴为*号时：由于*跟任意字符都匹配，所以是否匹配取决于当前左或上方的匹配情况
	 *     2、纵轴不为*号时：当前字符必须匹配，且左上方也必须匹配
	 */
	isMatch: function (str, pattern) {
		// 动态规划，矩阵初始化
		var dp = [],
			i = 0;
		for (i = 0; i <= pattern.length; i++) {
			dp[i] = [];
		}
		// 初始化矩阵初始值
		dp[0][0] = true;

		// 计算矩阵，从第二行开始
		for (i = 1; i <= pattern.length; i++) {
			var p = pattern.charAt(i - 1);
			// 初始化首列初始值，当*号不是首位时都为false
			dp[i][0] = (p == '*') && (i == 1);

			for (var j = 1; j <= str.length; j++) {
				var ch = str.charAt(j - 1);
				if (p == '*') {
					// 匹配字符为*号时，是否匹配取决于左或上方位置是否匹配
					dp[i][j] = dp[i][j - 1] || dp[i - 1][j];
				} else {
					// 匹配字符不为*号时，必须当前待匹配的字符相同且左上方位置匹配
					dp[i][j] = (p == ch || p == '?') && dp[i - 1][j - 1];
				}
			}
		}

		return dp[pattern.length][str.length];
	},

	/**
	 * AES加密
	 */
	encryptAES: function (str, key, charset) {
		charset = charset || "utf8";
		var cipher = crypto.createCipher("aes192", key);
		return cipher.update(str, charset, "hex") + cipher.final("hex");
	},

	/**
	 * AES解密
	 */
	decryptAES: function (str, key, charset) {
		charset = charset || "utf8";
		var decipher = crypto.createDecipher("aes192", key);
		return decipher.update(str, "hex", charset) + decipher.final(charset);
	}
};

module.exports = Utils;