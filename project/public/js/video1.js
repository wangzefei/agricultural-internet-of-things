var waitTitle = "待机";
var playTitle = "播放";
var failTitle = "失败";
var loadTitle = "登录中...";
var waitCode = 0;//待机
var playCode = 1;//播放
var failCode = -1;//失败
var streamType = {"1": "高清", "2": "标清"};

var isOk = false;
var cameraList = null;//保存视频设备
//var NVR = 0;//录像机的总数
var cameraSum = 0;//登录成功的不是录像机的总数
var maxWinId = 1;//保存当前的窗口数
var currStreamType = 1;//保存当前窗口的码流（清晰度），默认高清
var _currStreamType = 0;

// 全局保存当前选中窗口
var g_iWndIndex = 0; //可以不用设置这个变量，有窗口参数的接口中，不用传值
var winStreamType = Array();//保存各个窗口的清晰度
var winsCameras = Array();//保存窗口对应的视频设备信息
var camerasWinIds = Array();//保存已打开的视频设备对应的窗口编号
var openWinIds = ",";//保存已打开的视频窗口编号
var winsChannels = Array();//保存窗口对应的通道号
var winsCameraTypes = Array();//保存窗口对应的摄像头的类型（1:球机, 2:除球机以外（如：枪机））
//var unOpenWinIds = ",";//保存未打开的视频的窗口编号
//var winsPresetIds = Array();//保存窗口对应的预置点的id
var winsTalk = Array();//保存窗口是否在对讲中
var winsRecord = Array();//保存窗口是否在录制中

$(function () {
    //自定义视频插件启用
    if (typeof RunAiotVideo === 'function') {
        //存在且是function
        RunAiotVideo();
    }
    /*
     * 函数： I_CheckPluginInstall() 
     * 功能： 检查插件是否已安装（包含 Chrome 版本检查） 
     * 参数： 无 返回值：-2: Chrome 浏览器版本过高，不支持 NPAPI (wenVideoCtrl版本为1.0.9时有用)； -1: 未安装 ； 0: 已安装
     * 
     */
    if (-1 == WebVideoCtrl.I_CheckPluginInstall()) {
        if (confirm("未检测到插件，请先下载插件安装\n提示：下载安装后请刷新页面或者重启浏览器")) {
            downloadFile();
        }
    } else {
        WebVideoCtrl.I_InsertOBJECTPlugin("video");//此处的video为HTML页的#video
    }

    
    /*
     *  Web 插件初始化（包含插件事件注册） 
		     winWidth，winHeight在HTML页
		     szWidth  插件的宽度（单位为”px”， 100%表示撑满插件容器） 
		     szHight  插件的高度（单位为”px”， 100%表示撑满插件容器）
		     iWndowType 分屏类型：1- 1*1，2- 2*2，3- 3*3，4- 4*4，默认值为 1，单画面 
		     cbSelWnd  窗口选中事件回调函数，只包含一个字符串参数，里面的值是 XML cbSelWnd 是窗口选中事件的回调函数，用户可以传入函数，选中窗口后，开发包会自动调用这个 函数，参数是一个 XML.
		        格式如下：
			<?xml version="1.0"?> <RealPlayInfo> <SelectWnd>0</SelectWnd></RealPlayInfo>触发事件的窗口号，从0开始 
     * 
     */
    WebVideoCtrl.I_InitPlugin(winWidth, winHeight, {
        iWndowType: 1,//设置默认的视频窗口分割个数
        cbSelWnd: function (xmlDoc) {
            g_iWndIndex = $(xmlDoc).find("SelectWnd").eq(0).text();//获取窗口索引
            if (winStreamType[g_iWndIndex] == 1 || winStreamType[g_iWndIndex] == 2) {//从历史状态中获取当前索引窗口的清晰度状态，若标清或高清则记录当前状态
                currStreamType = winStreamType[g_iWndIndex];
            } else {//否则默认高清
                currStreamType = 1;//默认该窗口清晰度为高清
            }
            $("#streamType").val(streamType[currStreamType]);//设置显示层成的input为当前检测状态
            $("#streamTypeSel li").removeClass("active");
            $('#streamTypeSel li[value="' + currStreamType + '"]').addClass("active");//设置下拉选项中的当前状态的选中样式
			//设置窗口是否在对讲中或录制中的提示信息
            showDoing(g_iWndIndex);
			/*
			 * 函数： I_GetWindowStatus(iWndIndex) 
			 * 功能： 获取当前窗口的信息 
			 * 参数：  iWndIndex     窗口索引 
			 * 返回值：成功返回窗口信息对象，失败返回 null 
			 * 说明：  
			 * 窗口信息对象:  
			 * iIndex  窗口索引  
			 * szIP   窗口中正在播放的 IP 地址  
			 * iChannelID 窗口中正在播放的通道号  
			 * iPlayStatus 窗口播放状态：0-没有播放，1-预览，2-回放，3-暂停，4-单帧，5-倒放，6-倒放暂停
			 */
            var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
            if (oWndInfo != null && oWndInfo.iPlayStatus == 2) {//在回放tab中，正在播放
                $(".play-control").find("a").eq(0).attr("class", "vv-pause").attr("title", "暂停");
            } else {
                $(".play-control").find("a").eq(0).attr("class", "vv-play").attr("title", "播放");
            }
        }
    });

	
    /*
     * 函数： I_CheckPluginVersion() 
     * 功能：  插件版本比较，也可以检测插件是否安装，在插件嵌入之前就要进行检测 
     * 参数： 无 
     * 返回值：-2：没有安装插件，-1：需要升级，0：不用升级
     */
//  if (-1 == WebVideoCtrl.I_CheckPluginVersion()) {
//      if (confirm("检测到新的插件版本，请下载并升级! \n  是否立即下载？")) {
//          downloadFile();
//      }
//  }

    //分屏切换事件
    $("#splitWins div").click(function () {
        var num = $(this).attr("id");
        changeWndNum(num);
    });

    //清晰度的更改
    $("#streamTypeSel li").click(function(){
    	if ($(this).hasClass("active")) {
            return;
        }
        $StreamType = $(this).val();
        currStreamType = $StreamType;
        _currStreamType = $StreamType;
       
        var obj = $("li[winId='" + g_iWndIndex + "']");
        var camera = obj.data("camera");
        var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
        if (camera && oWndInfo) {//视频已打开
            var $confirmContent = {"1": "提示:高清模式对网络环境要求较高。是否进行转换？"}[$StreamType] || "提示:标清模式清晰度会降低但对网络要求不高。是否进行转换？";
            if (confirm($confirmContent)) {
            	 $("#streamTypeSel li").removeClass("active");
			        $(this).addClass("active");
			        $("#streamType").val(streamType[$StreamType]);
                changeStreamType(camera, $StreamType);
            }
        }else{
        	showMsg("未检测到视频");
        }
         
    });
    //全屏
    $("#fullscreen").click(function () {
        WebVideoCtrl.I_FullScreen(true);
    });

        

    //抓图
    $("#downPicture").click(function () {
        var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
        if (null == oWndInfo) {
            showMsg("请先选中一个已在播放视频的窗口！");
            return;
        }
        clickSetLocalCfg();//获取路径
        var idStr = "";
        if (controlOrLoop == "control") {//视频控制选项卡
            idStr = "previewPicPath";
        } else if (controlOrLoop == "loop") {//视频回放选项卡
            idStr = "playbackPicPath";
        }
        $nowPath = $("#" + idStr).val();
        if (!$nowPath) {
            showMsg("抱歉，抓图保存路径暂未设置，请先进行设置");
            clickOpenFileDlg(idStr, 0);
        }
        if ($("#" + idStr).val()) {
            clickCapturePic();
        }
    });

    //关闭(停止一个窗口预览)
    $("#close").click(function () {
        stopOne(g_iWndIndex);
    });

});





//视频插件下载
function downloadFile() {
    location.href = 'http://39.108.169.199:8080/WebComponentsKit.exe';
    alert("tip：下载的插件为低版本插件，不可升级。/n安装插件后请重启浏览器或者刷新页面");
}

//拼接视频设备ip
function setIP(streamUrl, httpPort) {
    return streamUrl + ":" + httpPort;
}

//更改某个窗口的码流状态
function changeStreamType(camera, sType) {
    //var obj = $("li[winId='" + g_iWndIndex + "']");
    //var camera = obj.data("camera");
    if (null == camera || undefined == camera) {
        return;
    }
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex),
        szIP = setIP(camera.streamUrl, camera.httpPort),
        iChannelID = camera.channel || 1,
        bZeroChannel = false;
    if ("" == szIP) {
        return;
    }

    if (oWndInfo != null) {// 已经在播放了，先停止
        WebVideoCtrl.I_Stop();
    }
    var iRet = WebVideoCtrl.I_StartRealPlay(szIP, {
        iStreamType: sType,
        iChannelID: iChannelID,
        bZeroChannel: bZeroChannel
    });
    winStreamType[g_iWndIndex] = $StreamType;//保存该窗口清晰度
    if (0 == iRet) {//开始预览成功
    } else {
    }
}

// 获取本地参数
function clickGetLocalCfg() {
    var xmlDoc = WebVideoCtrl.I_GetLocalCfg();
    $("#netsPreach").val($(xmlDoc).find("BuffNumberType").eq(0).text());//播放库缓冲区大小
    $("#wndSize").val($(xmlDoc).find("PlayWndType").eq(0).text());//播放窗口模式(0-充满，1-4:3，2-16:9)
    $("#rulesInfo").val($(xmlDoc).find("IVSMode").eq(0).text());//是否开启规则信息
    $("#captureFileFormat").val($(xmlDoc).find("CaptureFileFormat").eq(0).text());//抓图格式
    $("#packSize").val($(xmlDoc).find("PackgeSize").eq(0).text());//录像打包大小(0-256M,1-512M,2-1G)
    $("#recordPath").val($(xmlDoc).find("RecordPath").eq(0).text());//录像文件保存路径
    $("#downloadPath").val($(xmlDoc).find("DownloadPath").eq(0).text());//回放下载文件保存路径
    $("#previewPicPath").val($(xmlDoc).find("CapturePath").eq(0).text());//抓图文件保存路径
    $("#playbackPicPath").val($(xmlDoc).find("PlaybackPicPath").eq(0).text());//回放抓图文件保存路径
    $("#playbackFilePath").val($(xmlDoc).find("PlaybackFilePath").eq(0).text());//回放录像文件保存路径
    $("#protocolType").val($(xmlDoc).find("ProtocolType").eq(0).text());//协议类型(0-TCP,2-UDP)
   
    console.log(xmlDoc);
}

// 设置本地参数
function clickSetLocalCfg() {
    var arrXml = [];
    arrXml.push("<LocalConfigInfo>");
    arrXml.push("<PackgeSize>0</PackgeSize>");//录像打包大小(0-256M,1-512M,2-1G)
    arrXml.push("<PlayWndType>0</PlayWndType>");//播放窗口模式(0-充满，1-4:3，2-16:9)
    arrXml.push("<BuffNumberType>" + $("#netsPreach").val() + "</BuffNumberType>");//播放库缓冲区大小
    arrXml.push("<RecordPath>" + $("#recordPath").val() + "</RecordPath>");//录像文件保存路径
    arrXml.push("<CapturePath>" + $("#previewPicPath").val() + "</CapturePath>");//抓图文件保存路径
    arrXml.push("<PlaybackFilePath>" + $("#playbackFilePath").val() + "</PlaybackFilePath>");//回放录像文件保存路径
    arrXml.push("<PlaybackPicPath>" + $("#playbackPicPath").val() + "</PlaybackPicPath>");//回放抓图文件保存路径
    arrXml.push("<DownloadPath>" + $("#downloadPath").val() + "</DownloadPath>");//回放下载文件保存路径
    arrXml.push("<IVSMode>1</IVSMode>");//是否开启规则信息
    arrXml.push("<CaptureFileFormat>0</CaptureFileFormat>");//抓图格式
    arrXml.push("<ProtocolType>0</ProtocolType>");//协议类型(0-TCP,2-UDP)
    arrXml.push("</LocalConfigInfo>");

    var iRet = WebVideoCtrl.I_SetLocalCfg(arrXml.join(""));
    if (0 == iRet) {//本地配置设置成功
    	clickGetLocalCfg();
    } else {
    }
}

// 打开选择框 0：文件夹  1：文件
function clickOpenFileDlg(id, iType) {
    var szDirPath = WebVideoCtrl.I_OpenFileDlg(iType);
    if (szDirPath != -1 && szDirPath != "" && szDirPath != null) {
        $("#" + id).val(szDirPath);
    }
    clickSetLocalCfg();//设置本地参数
}

// 抓图
function clickCapturePic() {
    var re = false;
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (oWndInfo != null) {
        var szChannelID = winsChannels[g_iWndIndex],
            szPicName = (oWndInfo.szIP + "_" + oWndInfo.iChannelID + "_" + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss")).replace(/:/g, "-")+".jpg",
            iRet = WebVideoCtrl.I_CapturePic(szPicName);
        if (0 == iRet) {//抓图成功
            re = true;
        }
    }
    if (re) {
    	$("#some_tip").append("<span style='color: #ffffff;margin-left:40px'>抓图成功！在文件保存"+$nowPath+"</span><br>");
    } else {
        showMsg("抓图失败！", 2 * 1000);
    }
}

// 设置音量(暂废弃)
function clickSetVolume(volume, winId) {
    if (!winId) {
        winId = g_iWndIndex;
    }
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(winId),
        iVolume = parseInt(volume, 10);

    if (oWndInfo != null) {
        WebVideoCtrl.I_SetVolume(iVolume);//返回0设置成功
    }
}


// 开始录像
function clickStartRecord(winId) {
    if (!winId) {
        winId = g_iWndIndex;
    }
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(winId);
    if (!oWndInfo) {
        showMsg("该窗口现无视频播放，请先打开。");
        return;
    }
    if (!winsRecord[winId]) {//未在录制中
        clickGetLocalCfg();
        var recordPath = $("#recordPath").val();//获取路径
        if (recordPath) {
            var szChannelID = winsChannels[winId] || 1,
                szFileName = (oWndInfo.szIP + "_" + szChannelID + "_" + dateFormat(new Date(), "yyyy-MM-dd hh:mm:ss")).replace(/:/g, "-");//文件名称
            var iRet = WebVideoCtrl.I_StartRecord(szFileName);//返回0成功
            if (iRet == 0) {
                winsRecord[winId] = true;
            } else {
                winsRecord[winId] = false;
            }
            showDoing(winId);
        } else {
            showMsg("抱歉，录像文件保存路径暂未设置，请先进行设置");
            clickOpenFileDlg('recordPath', 0);
            if ($("#recordPath").val()) {
                clickStartRecord();
            }
        }
    }
}

// 停止录像
function clickStopRecord(winId) {
    if (!winId) {
        winId = g_iWndIndex;
    }
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(winId);
    if (oWndInfo != null) {
        if (winsRecord[winId]) {//正在录制中，就停止
            var iRet = WebVideoCtrl.I_StopRecord();
            if (iRet == 0) {//返回0成功
                winsRecord[winId] = null;
                showDoing(winId);
                $("#some_tip").append("<span style='color: #ffffff;margin-left:40px'>录制成功！在文件保存"+$("#recordPath").val()+"</span><br>");
            }
        }
    }
}

/**
 * 设置窗口是否在录制中或对讲中的提示信息
 * @param winId
 */
/*
 * 函数： I_GetWindowStatus(iWndIndex) 
 * 功能： 获取当前窗口的信息 
 * 参数：  iWndIndex     窗口索引 
 * 返回值：成功返回窗口信息对象，失败返回 null 
 * 说明：  
 * 窗口信息对象:  
 * iIndex  窗口索引  
 * szIP   窗口中正在播放的 IP 地址  
 * iChannelID 窗口中正在播放的通道号  
 * iPlayStatus 窗口播放状态：0-没有播放，1-预览，2-回放，3-暂停，4-单帧，5-倒放，6-倒放暂停
 */
function showDoing(winId) {
    $("#showDoing").html("");
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(winId);
    if (null != oWndInfo) {
        if (winsTalk[winId]) {
            $("#showDoing").append("<span style='color: #ffffff;'>对讲中…</span>");
        } else if (false == winsTalk[winId]) {
            $("#showDoing").append("<span style='color: #ffffff;'>对讲失败…</span>");
        }
        if (winsRecord[winId]) {
            $("#showDoing").append("<span style='color: #ffffff;'>录制中…</span>");
        } else if (false == winsRecord[winId]) {
            $("#showDoing").append("<span style='color: #ffffff;'>录制失败…</span>");
        }
    }
}


//登录
/*
 * 
 函数： I_Login(szIP, iPrototocol, iPort, szUserName, szPassword, options) 
 功能： 登录设备 
 参数：  	szIP    设备的 IP 地址或者普通域名(比如花生壳域名) 
 		iPrototocol  http 协议，1 表示 http 协议 2 表示 https 协议
		iPort  登录设备的 http/https 端口号，根据 iPrototocol 选择传入不同的端口 
		szUserName 登录用户名称 
		szPassword 用户密码   
		options   
			可选参数对象:  	async http 交互方式，true 表示异步，false 表示同步 
							cgi CGI 协议选择，1 表示 ISAPI，2 表示 PSIA，如果不传这个参数，会 自动选择一种设备支持的协议. 
							success 成功回调函数，有一个参数，表示返回的 XML 内容。 
							error 失败回调函数，有两个参数，第一个是 http 状态码，第二个是设 备返回的 XML(可能为空) 
返回值：无 
说明： 调用该函数登录设备，如果登录成功，即选定了 http/https 协议，以及 PSIA/ISAPI 协议，以后都采 用选定好的协议和设备进行交互。交互成功，会调用用户成功回调函数，失败则调用失败回调函 数。
 * */
//正常这些数据需要保存在服务器，在页面点击过来的时候在从数据库中加载回来
var public_ip="27.155.177.209:8889";
var public_prototocol="1";
var public_port="8889";
var public_username="admin";
var public_userpwd="a123456789";
function login() {
	var iRet = WebVideoCtrl.I_Login(public_ip, public_prototocol, public_port, public_username, public_userpwd, {  
		success: function(xmlDoc) {  //成功的回调函数         
			getChannelInfo();   
		}, 
		error: function(error) { //失败的回调函数 
			showMsg("初始化失败！",2000);
		}});
}
//获取通道列表
function getChannelInfo(){
	var szIP=public_ip;
	//模拟通道
	WebVideoCtrl.I_GetAnalogChannelInfo(szIP,{
		success:function(xmlDoc){
			console.log("开发者测试：模拟通道获取成功");
		},error:function(error){
			console.log("开发者测试：模拟通道获取失败");
		}
	});
	// 数字通道
	WebVideoCtrl.I_GetDigitalChannelInfo(szIP, {
		async: false,
		success: function (xmlDoc) {
			console.log("开发者测试：数字通道获取成功");
			var oChannels = $(xmlDoc).find("InputProxyChannelStatus");
			var  params = []; 
			$.each(oChannels, function (i) {
				var id = $(this).find("id").eq(0).text(),
					name = $(this).find("name").eq(0).text(),
					online = $(this).find("online").eq(0).text(),
					ipaddress=$(this).find('ipAddress').eq(0).text(),
					port=$(this).find('managePortNo').eq(0).text();
					if(online=="true"){
						online="在线";
					}else{
					online="离线";
					}
					params.push({"name":name,"ipaddress":public_ip,"port":public_port,"online":online,"id":id}); 
					
				
			});
			var json = JSON.stringify(params); 
			cameraList=params;
			loadCameras();
		},
		error: function () {
			console.log("开发者测试：数字通道获取失败");
		}
	});
	// 零通道
	WebVideoCtrl.I_GetZeroChannelInfo(szIP, {
		async: false,
		success: function (xmlDoc) {
			console.log("开发者测试：零通道获取成功");
		},
		error: function () {
			console.log("开发者测试：零通道获取失败");
		}
	});
}

//function getDataFromAjax(){
//	var camData=[];
//	camData.push({"place_name":"我是区块1","name":"IPdome","ipaddress":"27.155.177.209:8889","port":"8889","online":"无所谓","id":"1"});
//	camData.push({"place_name":"我是区块2","name":"IPCamera 02","ipaddress":"27.155.177.209:8889","port":"8889","online":"无所谓","id":"2"});
//	login1();
//	cameraList=camData;
//	loadCameras();
//}

function login1() {
	var iRet = WebVideoCtrl.I_Login(public_ip, public_prototocol, public_port, public_username, public_userpwd, {  
		success: function(xmlDoc) {  //成功的回调函数         
			//getChannelInfo();   
			;
		}, 
		error: function(error) { //失败的回调函数 
			showMsg("初始化失败！",2000);
		}});
}

//解析视频设备列表
function loadCameras() {
//	console.log(cameraList);
    //清空视频控制选项卡中的视频设备列表
    $("#cameraList").html("");
    //清空视频回放选项卡中的已登录录像机下拉框
    $("#loginCamera").empty();
    $("#loginCamera").append("<option value=''>请选择设备</option>");
    if (null != cameraList) {
        cameraSum = cameraList.length;//设置设备的数量
        setCameraList();//加载视频列表

        //加载完后的处理
        isOk = true;
        if (controlOrLoop == "control") {//如果是在控制选项卡
            setWndNum();//设置窗口分割数
        }
        //设置滚动条
        $('#channelList ul').height(200).rollbar({zIndex: 10, pathPadding: 2, blockGlobalScroll: !0});
    }else{
    	showMsg("该站点下无摄像头设备",1500);
    	isOk=false;
    }

}
//将解析出来的视频设备呈现出来
function setCameraList() {
    var NVRList = Array();//保存网络录像机
    var NVRNum = 0;//保存网络录像机数量
    for (var i = 0; i < cameraList.length; i++) {
        var camera = cameraList[i];
        var deviceName = cutStr(camera.name, 0, 6);
        var li="";
        if(i==0){
            li = $('<option  selected="">').data("camera", camera);
        }else{
            li = $('<option >').data("camera", camera);
        }
//      li.append('' + camera.name + '');
		li.append(''+camera.place_name+ '');
        $("#select").append(li);

      
      var ipStr = setIP(camera.ipaddress, camera.port);
//      var option = $("<option value='" + ipStr + "'>" + camera.name + "</option >").data("camera", camera);
 		var option = $("<option value='" + ipStr + "'>" + camera.place_name + "</option >").data("camera", camera);
        $("#loginCamera").append(option);
        }
    try{
        form.render('select');
    }catch(e){;}
}
//获取当前视频
function getNowVideo(){
    for(var i=0;i<$('#select').next().children('dl').children('dd').length;i++){
        if($('#select').next().children('dl').children('dd').eq(i).hasClass('layui-this')){
            cameraClick($('#select').children('option').eq(i));
        }
    }
}

//点击视频设备开始预览
function cameraClick(obj) {
    if (!isOk) {
        if (!confirm("视频设备未全部加载完成，是否仍继续（不推荐）？")) {
            return;
        }
    }
//  
//  console.log($('#select option:selected').text());
    var camera = $(obj).data("camera");
    var channelId = camera.id;
    var key = camera.deviceId + "_" + channelId;
//  console.log(camerasWinIds[key]);
//    if (null != camerasWinIds[key] && undefined != camerasWinIds[key]) {
//        showMsg("该视频已在" + (parseInt(camerasWinIds[key], 10) + 1) + "号窗口打开！");
//        return;
//    }
    var iObj = $(obj).find("i").eq(0);
  changeState(iObj, null);//登录中
 	startPlay(camera, obj);
}

//开始预览
function startPlay(camera, obj) {
    // 开始预览
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex),
        szIP = camera.ipaddress;
        iStreamType = parseInt(_currStreamType, 10),
        iChannelID = camera.id || 1,
        bZeroChannel = false;
    if (iStreamType == 0) {//用户未手动切换过码流，就用后台配置的默认的
        iStreamType = camera.streamType;
    }
    $("#streamType").val(streamType[iStreamType]);
    $("#streamTypeSel li").removeClass("active");
    $('#streamTypeSel li[value="' + iStreamType + '"]').addClass("active");
    if ("" == szIP) {
        return;
    }
    if (oWndInfo != null) {// 已经在播放了，先停止
        stopOne(g_iWndIndex);
    }
    var iRet = WebVideoCtrl.I_StartRealPlay(szIP, {
        iStreamType: iStreamType,
        iChannelID: iChannelID,
        bZeroChannel: bZeroChannel
    });
    var iObj = $(obj).find("i").eq(0);
    winStreamType[g_iWndIndex] = iStreamType;//保存该窗口清晰度
    if (0 == iRet) {//预览成功
        $(obj).attr('winId', g_iWndIndex);
        winsCameras[g_iWndIndex] = camera;//保存窗口对应的视频设备信息
        var key = camera.deviceId + "_" + iChannelID;
        camerasWinIds[key] = g_iWndIndex;//保存已打开的视频设备对应的窗口编号
        openWinIds += g_iWndIndex + ",";//保存已打开的视频窗口编号
        winsChannels[g_iWndIndex] = iChannelID;//保存窗口对应的通道号
        winsCameraTypes[g_iWndIndex] = camera.cameraType;//保存窗口对应的类型（球机或枪机）
        changeState(iObj, playCode);
    } else {
        changeState(iObj, failCode, camera.name);
    }
}


//解析完设备列表，设置窗口分割数
function setWndNum() {
    //判断当前总视频数量,并更改窗口布局（1x1,2x2,3x3,4x4）
//  if (cameraSum <= 1) {
//      changeWndNum(1);
//  } else if (cameraSum <= 4) {
//      changeWndNum(2);
//  } else if (cameraSum <= 9) {
//      changeWndNum(3);
//  } else {
//      changeWndNum(4);
//  }
 changeWndNum(1);
}

/*
 * 函数： I_ChangeWndNum(iWndType) 
 * 功能： 修改画面分割类型 
 * 参数：  iWndType     
 * 画面分割类型：1- 1*1，2- 2*2，3- 3*3，4- 4*4 
 * 返回值：成功返回 0，失败返回-1
 * 
 */
function changeWndNum(iType) {
    iType = parseInt(iType, 10);
    maxWinId = iType * iType;//设置最大的窗口数
    $("#splitWins a, #splitWins div").each(function () {
        $(this).removeClass("active");
    });
    $("#splitWins a, #splitWins div").eq(iType - 1).addClass("active");
    WebVideoCtrl.I_ChangeWndNum(iType);
}

/**
 * 改变视频列表的状态
 * @param obj 页面中设备状态的容器对象或者窗口编号
 * @param state 需要改成的状态(0：待机，1：播放，-1：失败)
 * @param deviceName 设备名称
 */
function changeState(obj, state, deviceName) {
    if (typeof (obj) == "object") {
        obj = $(obj);
    } else {
        obj = $("li[winId='" + obj + "']").find("i").eq(0);
    }
    if (state == waitCode) {//待机状态
        obj.removeAttr("class").attr("class", "wait").attr("title", waitTitle);
    } else if (state == playCode) {//播放状态
        obj.removeAttr("class").attr("class", "play").attr("title", playTitle);
    } else if (state == failCode) {//失败状态
        obj.removeAttr("class").attr("class", "fail").attr("title", failTitle);
        if (null == deviceName || undefined == deviceName || "" == deviceName) {
            deviceName = "本设备";
        }
        showMsg("抱歉，" + deviceName + "不可读取或者离线，请检查网络与设备的状态是否正常！");
    } else {
        obj.removeAttr("class").attr("class", "loading").attr("title", loadTitle);
    }
}

// PTZ控制 9为自动，1,2,3,4,5,6,7,8为方向PTZ
var g_bPTZAuto = false;
function mouseDownPTZControl(iPTZIndex) {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex),
        bZeroChannel = false,
        iPTZSpeed = $("#ptzspeed").val(),
        bStop = false;
    if (bZeroChannel) {// 零通道不支持云台
        return;
    }
    if (oWndInfo != null) {
        if (!hasAuth) {
            showMsg("对不起，该用户没有控制权限", 1.5 * 1000);
            return;
        }
        if (9 == iPTZIndex && g_bPTZAuto) {
            iPTZSpeed = 0;// 自动开启后，速度置为0可以关闭自动
            bStop = true;
        } else {
            g_bPTZAuto = false;// 点击其他方向，自动肯定会被关闭
            bStop = false;
        }
	console.log(iPTZIndex+"--"+bStop+"--"+iPTZSpeed);
        WebVideoCtrl.I_PTZControl(iPTZIndex, bStop, {
            iPTZSpeed: iPTZSpeed,
            success: function (xmlDoc) {
                if (9 == iPTZIndex) {
                    g_bPTZAuto = !g_bPTZAuto;
                }
            },
            error: function (e) {
            	console.log(e);
            }
        });
    }else{
    	showMsg("该窗口无视频播放，请先打开", 1 * 1000);
    }
}

// 方向PTZ停止
function mouseUpPTZControl() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (oWndInfo != null) {
        WebVideoCtrl.I_PTZControl(1, true, {
            success: function (xmlDoc) {//停止云台成功
            	console.log("停止"+xmlDoc);
            },
            error: function (e) {
            	console.log("停止"+e);
            }
        });
    }
}


// 打开声音
function clickOpenSound() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (oWndInfo != null) {
        var allWndInfo = WebVideoCtrl.I_GetWindowStatus();
        // 循环遍历所有窗口，如果有窗口打开了声音，先关闭
        for (var i = 0, iLen = allWndInfo.length; i < iLen; i++) {
            oWndInfo = allWndInfo[i];
            if (oWndInfo.bSound) {
                WebVideoCtrl.I_CloseSound(oWndInfo.iIndex);
                break;
            }
        }
        var iRet = WebVideoCtrl.I_OpenSound();
        if (0 == iRet) {//打开声音成功
        	showMsg("打开声音成功", 1 * 1000);
        } else {
        	showMsg("打开声音失败", 1 * 1000);
        }
    }
}

// 关闭声音
function clickCloseSound() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (oWndInfo != null) {
        var iRet = WebVideoCtrl.I_CloseSound();
        if (0 == iRet) {//关闭声音成功
        	showMsg("关闭声音成功", 1 * 1000);
        } else {
        	showMsg("关闭声音失败", 1 * 1000);
        }
    }
}

//停止一个窗口预览
function stopOne(winId) {
    winId = parseInt(winId);
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(winId);
    if (oWndInfo != null) {
//      clickStopVoiceTalk(winId);//停止对讲
        clickStopRecord(winId);//停止录像
        var iRet = WebVideoCtrl.I_Stop(winId);
        if (0 == iRet) {//停止预览成功
            //现将当前窗口播放中的设备状态变为待机
            var liObj = $("li[winId='" + winId + "']");
//          if (liObj.find("i").attr("class").indexOf("play") >= 0) {
//              changeState(liObj.find("i"), waitCode);
//              var cam = liObj.data("camera");
//              var k = cam.deviceId + "_" + cam.id;
//              //删除原来视频设备打开对应的窗口号
//              delete camerasWinIds[k];//= null;
//          }
            $("li[winId='" + winId + "']").removeAttr("winId");

            winStreamType[winId] = null;//winStreamType = winStreamType.splice(winId, 1);//删除当前窗口对应的清晰度
            winsCameras[winId] = null;//winsCameras.splice(winId, 1);//删除当前窗口对应的视频设备信息
            //delete camerasWinIds[k];//删除当前设备对应的窗口号
            openWinIds = openWinIds.replace("," + winId + ",", ",");//删除当前打开的窗口号
            winsChannels[winId] = null;//winsChannels.splice(winId, 1);//删除当前窗口对应的通道号
            winsCameraTypes[winId] = null;//winsCameraTypes.splice(winId, 1);//删除当前窗口对应的摄像头类型
        }
    }
}

// 停止全部预览
function stopAll() {
    if (maxWinId == "" || maxWinId == null) {
        maxWinId = 16;
    }
    for (var i = 0; i < maxWinId; i++) {
        var oWndInfo = WebVideoCtrl.I_GetWindowStatus(i);
        if (oWndInfo != null) {
//          clickStopVoiceTalk(i);//停止对讲
            clickStopRecord(i);//停止录像
            var iRet = WebVideoCtrl.I_Stop(i);
            if (0 == iRet) {//停止预览成功
            } else {
            }
        }
    }
    winStreamType.length = 0;//清空各窗口对应的清晰度
    winsCameras.length = 0;//清空各窗口对应的视频设备信息
    camerasWinIds = Array();//清空设备对应的窗口号
    openWinIds = ",";//清空已打开的窗口号
    winsChannels.length = 0;//清空窗口对应的通道号
    winsCameraTypes.length = 0;//清空窗口对应的摄像头类型
    $("#cameraList li").each(function () {//改变正在播放视频的样式
        var state = $(this).find("i").attr("class");
        //现将当前窗口播放中的列表状态变为待机
        if (state.indexOf("play") >= 0) {
            changeState($(this).find("i"), waitCode);
        }
        $(this).removeAttr("winId");
    });

    $("#searchList li").each(function () {//改变录像列表的样式
        $(this).removeClass("activ");
        $(this).removeAttr("winId");
    });
}



/*****************************************************视频回放部分**********************************************/
// 搜索录像
var iSearchTimes = 0;
function videoSearch(iType) {
    var ipval = $("#loginCamera").val();
    if (ipval == "" || ipval == null) {
        showMsg("请先选择一个设备，再进行搜索！");
        return;
    }
    if (!isOk && iType == 0) {
        if (!confirm("视频设备未全部加载完成，是否仍继续（不推荐）？")) {
            return;
        }
    }
    if ($("#cLogin").css("display") != "none") {
        showMsg("正在搜索，请稍等！");
        return;
    }
    var camera = $("#loginCamera option:selected").data("camera");
    $("#cLogin").show();
    $("#loginCamera").attr("disabled", "true");
    $("#searchList").html("");
    searchBack(camera);
}

/**
 * 搜索回放录像
 */
function searchBack(camera) {
	
    var startTime = $("#startTime").val();
    var endTime = $("#endTime").val();
    if (startTime == "" || endTime == "" || startTime > endTime) {
        showMsg("请选择正确的起止时间!");
        $("#cLogin").hide();
                $("#loginCamera").attr("disabled", false);
        return;
    }
    var szIP = camera.ipaddress,
        iChannelID = camera.id || 1,
        bZeroChannel = false;

    if (bZeroChannel) {// 零通道不支持录像搜索
    	$("#cLogin").hide();
                $("#loginCamera").attr("disabled", false);
        return;
    }
    WebVideoCtrl.I_RecordSearch(szIP, iChannelID, startTime, endTime, {
        iSearchPos: iSearchTimes * 40,
        success: function (xmlDoc) {
            if ("MORE" === $(xmlDoc).find("responseStatusStrg").eq(0).text()) {
                for (var i = 0, nLen = $(xmlDoc).find("searchMatchItem").length; i < nLen; i++) {
                    var szPlaybackURI = $(xmlDoc).find("playbackURI").eq(i).text();
                    if (szPlaybackURI.indexOf("name=") < 0) {
                        break;
                    }
                    var szStartTime = $(xmlDoc).find("startTime").eq(i).text();
                    szStartTime = (szStartTime.replace("T", " ")).replace("Z", "");
                    var szEndTime = $(xmlDoc).find("endTime").eq(i).text();
                    szEndTime = (szEndTime.replace("T", " ")).replace("Z", "");
                    var szFileName = szPlaybackURI.substring(szPlaybackURI.indexOf("name=") + 5, szPlaybackURI.indexOf("&size="));

                    var liId = iSearchTimes * 40 + i + 1;
                    var li = $("<li></li>").attr("id", "id" + liId);
                    li.append('<span class="xh">' + liId + ':</span>');
                    var title = szStartTime + "至" + szEndTime;
                    li.append("<span class='name' title='" + title + "' onclick='clickPlayback(\"" + szIP + "\", " + iChannelID + ", \"" + szStartTime + "\", \"" + szEndTime + "\", " + liId + ");'>" + title + "</span>");
                    //li.append("<span class='plays' onclick='clickPlayback(\"" + szIP + "\", \"" + szStartTime + "\", \"" + szEndTime + "\", " + liId + ");'></span>");
                    li.append("<span><a href='javascript:void(0);' onclick='startDownloadRecord(\"" + szIP + "\", " + iChannelID + ", \"" + szStartTime + "\", " + liId + ");'>下载</a></span>");
                    li.append('<div style="clear:both;"></div>');
                    $("#searchList").append(li);
                    $("#id" + liId).data("playbackURI", szPlaybackURI);
                }
                iSearchTimes++;
                searchBack(camera);// 继续搜索
            } else if ("OK" === $(xmlDoc).find("responseStatusStrg").eq(0).text()) {
                var iLength = $(xmlDoc).find("searchMatchItem").length;
                for (var i = 0; i < iLength; i++) {
                    var szPlaybackURI = $(xmlDoc).find("playbackURI").eq(i).text();
                    if (szPlaybackURI.indexOf("name=") < 0) {
                        break;
                    }
                    var szStartTime = $(xmlDoc).find("startTime").eq(i).text();
                    szStartTime = (szStartTime.replace("T", " ")).replace("Z", "");
                    var szEndTime = $(xmlDoc).find("endTime").eq(i).text();
                    szEndTime = (szEndTime.replace("T", " ")).replace("Z", "");
                    var szFileName = szPlaybackURI.substring(szPlaybackURI.indexOf("name=") + 5, szPlaybackURI.indexOf("&size="));

                    var liId = iSearchTimes * 40 + i + 1;
                    var li = $("<li></li>").attr("id", "id" + liId);
                    li.append('<span class="xh">' + liId + ':</span>');
                    var title = szStartTime + "至" + szEndTime;
                    li.append("<span class='name' title='" + title + "' onclick='clickPlayback(\"" + szIP + "\", " + iChannelID + ", \"" + szStartTime + "\", \"" + szEndTime + "\", " + liId + ");'>" + title + "</span>");
                    //li.append("<span class='plays' onclick='clickPlayback(\"" + szIP + "\", \"" + szStartTime + "\", \"" + szEndTime + "\", " + liId + ");'></span>");
                    li.append("<span><a href='javascript:void(0);' onclick='startDownloadRecord(\"" + szIP + "\", " + iChannelID + ", \"" + szStartTime + "\"," + liId + ");'>下载</a></span>");
                    li.append('<div style="clear:both;"></div>');
                    $("#searchList").append(li);
                    $("#id" + liId).data("playbackURI", szPlaybackURI);
                }
                $("#cLogin").hide();
                $("#loginCamera").attr("disabled", false);
            } else if ("NO MATCHES" === $(xmlDoc).find("responseStatusStrg").eq(0).text() && iSearchTimes == 0) {
                setTimeout(function () {
                	$("#cLogin").hide();
                	$("#loginCamera").attr("disabled", false);
                    $("#searchList").html("没有录像文件");
                }, 50);
            }
        },
        error: function () {
        	$("#cLogin").hide();
                	$("#loginCamera").attr("disabled", false);
            $("#searchList").html("搜索录像文件失败");
        }
    });
}

/**
 * 播放按钮
 */
function startPlayback() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (oWndInfo != null) {
        if (oWndInfo.iPlayStatus == 2) {//正在播放，就暂停
            WebVideoCtrl.I_Pause();
            $(".play-control").find("a").eq(0).attr("class", "vv-play").attr("title", "播放");
        } else if (oWndInfo.iPlayStatus == 3) {//暂停，就恢复播放
            WebVideoCtrl.I_Resume();
            $(".play-control").find("a").eq(0).attr("class", "vv-pause").attr("title", "暂停");
        }
    } else {//开始播放所选择录像机的时间段内所有的录像
        var ipval = $("#loginCamera").val();
        if (ipval == "" || ipval == null) {
            showMsg("请先选择一个设备进行搜索！");
            return;
        }
        if (!isOk) {
            if (!confirm("视频设备未全部加载完成，是否仍继续（不推荐）？")) {
                return;
            }
        }
        if ($("#searchList li").length <= 0) {
            showMsg("没有可播放的录像，请先搜索！");
            return;
        }
        var camera = $("#loginCamera option:selected").data("camera");
        var szIP = setIP(ipval, camera.httpPort),
            bZeroChannel = false,
            iChannelID = camera.channel || 1,
            szStartTime = $("#startTime").val() ;//+ " 00:00:00",// 00:00:00
            szEndTime = $("#endTime").val() ;//+ " 23:59:59",// 23:59:59
        //bChecked = $("#transstream").prop("checked"),
            iRet = -1;
        if (bZeroChannel) {// 零通道不支持回放
            return;
        }

        iRet = WebVideoCtrl.I_StartPlayback(szIP, {
            iChannelID: iChannelID,
            szStartTime: szStartTime,
            szEndTime: szEndTime
        });

        if (0 == iRet) {//开始回放成功
            $(".play-control").find("a").eq(0).attr("class", "vv-pause").attr("title", "暂停");
        } else {
            showMsg("播放失败");
        }
    }
}

/**
 * 点击录像列表进行播放
 * @param ip
 * @param channel 通道号
 * @param startTime 开始时间
 * @param endTime 结束时间
 * @param trId 哪一条录像文件
 */
function clickPlayback(ip, channel, startTime, endTime, trId) {
    if (ip == null || ip == "" || "" == startTime || "" == endTime) {
        showMsg("播放失败！");
        return;
    }
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (oWndInfo != null) {
        //已经在播放了，就停止原来的
        WebVideoCtrl.I_Stop();
    }
    //设置原来录像列表的样式
    $("#searchList li[winId='" + g_iWndIndex + "']").removeClass("activ");
    $("#searchList li[winId='" + g_iWndIndex + "']").removeAttr("winId");
    var iRet = -1;
    iRet = WebVideoCtrl.I_StartPlayback(ip, {
        iChannelID: channel,
        szStartTime: startTime,
        szEndTime: endTime
    });
    if (0 == iRet) {
        $("#id" + trId).attr("winId", g_iWndIndex);
        $("#id" + trId).addClass("activ");
        $(".play-control").find("a").eq(0).attr("class", "vv-pause").attr("title", "暂停");
    } else {
        showMsg("播放失败！");
    }
}

/**
 * 停止回放
 */
function closeOne() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (oWndInfo != null) {
        //已经在播放了，就停止，同时设置原来录像列表的样式
        WebVideoCtrl.I_Stop();
        $("#searchList li[winId='" + g_iWndIndex + "']").removeClass("activ");
        $("#searchList li[winId='" + g_iWndIndex + "']").removeAttr("winId");
    }
}

// 暂停
function clickPause() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (oWndInfo != null) {
        var iRet = WebVideoCtrl.I_Pause();
        if (0 == iRet) {//暂停成功
        } else {
        }
    }
}

/**
 * 播放下一个
 */
function nextOne() {
    var oWndInfo = WebVideoCtrl.I_GetWindowStatus(g_iWndIndex);
    if (null == oWndInfo) {//窗口未打开，直接查找未播放的视频
        $("#searchList").find("li").each(function () {
            var winId = $(this).attr("winId");
            if (undefined == winId) {
                $(this).find(".name").eq(0).click();
                return false;
            }
        });
    } else {//窗口已有视频在播放，就先关闭原来的，再查找该视频下面未播放的视频
        var trSize = $("#searchList li[winId='" + g_iWndIndex + "']").nextAll().length;
        if (trSize == 0) {
            showMsg("不好意思，没有下一个了！");
            return;
        }
        var num = 0;//当前播放视频后面已播放的视频数量
        $("#searchList li[winId='" + g_iWndIndex + "']").nextAll().each(function () {
            var winId = $(this).attr("winId");
            if (undefined == winId) {
                closeOne();//先关闭当前窗口打开的视频
                var obj = $(this);
                setTimeout(function () {
                    obj.find(".name").eq(0).click();
                }, 200);
                return false;
            } else {
                num++;
            }
            if (num == trSize) {
                showMsg("不好意思，没有下一个了！");
            }
        });
    }
}


// 下载录像
var iDownloadID = -1;
var tDownloadProcess = 0;
function startDownloadRecord(ip, channel, startTime, i) {
    clickGetLocalCfg();
    $nowPath = $("#downloadPath").val();
    if ($nowPath == "" || $nowPath == null) {
        if (confirm("抱歉，视频文件保存路径暂未设置，请先进行设置")) {
            clickOpenFileDlg('downloadPath', 0);
            if ($("#downloadPath").val()) {
                startDownloadRecord(ip, channel, i);
            }
        }
    } else {
        var szIP = ip,
            szFileName = (szIP + "_" + channel + "_" + startTime).replace(/:/g, "-"),
            szPlaybackURI = $("#id" + i).data("playbackURI");
        if ("" == szIP) {
            return;
        }

        iDownloadID = WebVideoCtrl.I_StartDownloadRecord(szIP, szPlaybackURI, szFileName);
        if (iDownloadID < 0) {
            var iErrorValue = WebVideoCtrl.I_GetLastError();
            if (34 == iErrorValue) {
            	showMsg("录像文件下载成功，文件位于"+$nowPath, 5 * 1000);
            } else if (33 == iErrorValue) {
                if (confirm(szIP + " 空间不足，是否更改路径？")) {
                    clickOpenFileDlg('downloadPath', 0);
                    startDownloadRecord(ip, i);
                }
            } else {
                showMsg(szIP + " 下载失败！");
            }
        } else {
            $("<div id='downProcess' class='freeze'></div>").appendTo("body");
            //回放录像下载进度浮层大小
            var downWidth = 280;
            var downHeight = 260;
            if (isCenter) {
                downHeight = 300;
            }
            tDownloadProcess = setInterval("downProcess(" + downWidth + "," + downHeight + "," + i + ")", 1000);
        }
    }
}

// 下载进度
function downProcess(downWidth, downHeight) {
    var topWidth = parseInt($("#videoFiles .rollbar-content").css("top").replace("px", ""));
    var iStatus = WebVideoCtrl.I_GetDownloadStatus(iDownloadID);
    if (0 == iStatus) {
        $("#downProcess").css({
            position: "absolute",
            "background": '#ddd',
            filter: "alpha(opacity = 50)",
            "-moz-opacity": 0.5,
            "-khtml-opacity": 0.5,
            opacity: 0.5,
            "z-index": 9999,
            width: downWidth + "px",
            height: downHeight + "px",
            "text-align": "center",
            "line-height": downHeight + "px",
            "font-size": "14px",
            "font-weight": "bold",
            "color": "red",
            "over-flow": "hidden",

            left: ($("#searchList").offset().left - 10) + "px",
            top: ($("#searchList").offset().top - 10 - topWidth) + "px"
        });
        var iProcess = WebVideoCtrl.I_GetDownloadProgress(iDownloadID);
        if (iProcess < 0) {
            clearInterval(tDownloadProcess);
            tDownloadProcess = 0;
        } else if (iProcess < 100) {
            $("#downProcess").text(iProcess + "%");
        } else {
            $("#downProcess").text("100%");
            setTimeout(function () {
                $("#downProcess").remove();
            }, 1000);

            WebVideoCtrl.I_StopDownloadRecord(iDownloadID);

            showMsg("录像下载完成!");
            clearInterval(tDownloadProcess);
            tDownloadProcess = 0;
        }
    } else {
        WebVideoCtrl.I_StopDownloadRecord(iDownloadID);
        clearInterval(tDownloadProcess);
        tDownloadProcess = 0;
        iDownloadID = -1;
    }
}

// 格式化时间
function dateFormat(oDate, fmt) {
    var o = {
        "M+": oDate.getMonth() + 1, //月份
        "d+": oDate.getDate(), //日
        "h+": oDate.getHours(), //小时
        "m+": oDate.getMinutes(), //分
        "s+": oDate.getSeconds(), //秒
        "q+": Math.floor((oDate.getMonth() + 3) / 3), //季度
        "S": oDate.getMilliseconds()//毫秒
    };
    if (/(y+)/.test(fmt)) {
        fmt = fmt.replace(RegExp.$1, (oDate.getFullYear() + "").substr(4 - RegExp.$1.length));
    }
    for (var k in o) {
        if (new RegExp("(" + k + ")").test(fmt)) {
            fmt = fmt.replace(RegExp.$1, (RegExp.$1.length == 1) ? (o[k]) : (("00" + o[k]).substr(("" + o[k]).length)));
        }
    }
    return fmt;
}
/**
 * 字符串截取固定长度
 * @param str 需要截取的字符串
 * @param start 开始截取的位置
 * @param length 需要的字符串长度（当原来的字符串长度大于需要的长度时。截取后加上“...”）
 * @returns {*}
 */
function cutStr(str, start, length) {
    if (str) {
        str = str.length > length ? str.substr(start, length - 1) + "..." : str;
    } else {
        str = "";
    }
    return str;
}