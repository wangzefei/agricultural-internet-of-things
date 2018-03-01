/**
 * Created by Qizitech on 2017/11/15.
 */
//判断是否是IE8，如果是则强制终止页面加载
var browser = navigator.appName
var b_version = navigator.appVersion
var version = b_version.split(";");
var trim_Version = version[1].replace(/[ ]/g, "");
if(browser == "Microsoft Internet Explorer" && trim_Version == "MSIE6.0" || browser == "Microsoft Internet Explorer" && trim_Version == "MSIE7.0" || browser == "Microsoft Internet Explorer" && trim_Version == "MSIE8.0") {
    alert("部分功能在IE8下不可使用，已终止页面加载,请打开极速模式或更换浏览器");
    if(window.stop)
        window.stop();
    else
        document.execCommand("Stop");
}