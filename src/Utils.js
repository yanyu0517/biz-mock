/*
 * @Author: xiongsheng
 * @Date:   2017-09-29 16:37:48
 * @Last Modified by:   xiongsheng
 * @Last Modified time: 2017-09-29 16:43:51
 */
var Utils = {
    //将参数对象转为字符串
    serialize: function(obj) {
        if (typeof obj === 'string') {
            return obj;
        }
        return Object.keys(obj).map(function(key) {
            return [encodeURIComponent(key), encodeURIComponent(obj[key])].join('=')
        }).join('&');
    },
    //拼接url
    concatUrl: function(urlA, urlB) {
        var endAFlag = urlA[urlA.length - 1] === '/',
            firstBFlag = urlB[0] === '/';
        if (endAFlag && firstBFlag) {
            return urlA + urlB.slice(1);
        } else if (!endAFlag && !firstBFlag) {
            return urlA + '/' + urlB;
        } else {
            return urlA + urlB;
        }
    }
}

module.exports = Utils;
