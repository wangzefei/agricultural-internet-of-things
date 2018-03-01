/**
 * Created by Qizitech on 2017/10/24.
 */
var map = "";
var info = "";
var drivingService="";
//百度地图转腾讯地图，百度地图坐标转腾讯地图坐标。这个函数是用户坐标转换的，12316那边采用的是百度坐标系，跟腾讯坐标系还是有一定差距，所以在使用坐标的时候都需要对坐标进行转换
function turn(){
//			latitude经度
//			longitude纬度
    qq.maps.convertor.translate(new qq.maps.LatLng(latitude, longitude), 3, function(res) {
        latitude = res[0].lat;
        longitude = res[0].lng;
    });
}
function init() {
    //初始化中心点
    var center = new qq.maps.LatLng(26.040435,119.355812);
    map = new qq.maps.Map(document.getElementById("container"), {
        // 地图的中心地理坐标。
        center: center,
        zoom: 13
    });
    //添加到提示窗
    info = new qq.maps.InfoWindow({
        map: map
    });
    //路线规划
    drivingService = new qq.maps.DrivingService({
        map: map,
        //展现结果
        panel: document.getElementById('infoDiv')

    });
    getlocal();
}
//这里显示已定位的点，需要在初始化之后调用
function getlocal() {
    //这个JSON文件里我存了一些定位点信息
    $.get('../public/js/location.json').done(function(data) {
        for(var i = 0; i < data.length; i++) {
            var marker = new qq.maps.Marker({
                position: new qq.maps.LatLng(data[i].lat, data[i].lng),
                map: map
            });
            var anchor = new qq.maps.Point(18, 15),
                size = new qq.maps.Size(25, 33),
                origin = new qq.maps.Point(0, 0),
                markerIcon = new qq.maps.MarkerImage("../public/img/position1.png", size, origin, anchor);//自定义定位图表
            marker.setIcon(markerIcon);
            //定位点点击事件，这里默认显示tip信息，可以加入跳转
            qq.maps.event.addListener(marker, 'click', function(e) {
                info.open();
                $.get('../public/js/location.json').done(function(data) {
                    for(var j = 0; j < data.length; j++) {
                        if(e.latLng.getLat() == data[j].lat && e.latLng.getLng() == data[j].lng) {
                            info.setContent('<a href="main1.html" target="_blank"><div style="text-align:center;white-space:nowrap;' +
                                'margin:10px;">' + data[j].
                                    des + '</div></a>');
                            info.setPosition(new qq.maps.LatLng(e.latLng.getLat(), e.latLng.getLng()));
//									window.open('main1.html', '_blank');
                        }
                    }
                });
            });
        }
    });
}