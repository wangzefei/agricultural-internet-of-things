/**
 * Created by Qizitech on 2017/10/24.
 */
layui.use(['form'], function() {
    var form = layui.form;
})

layui.use('element', function(){
    var $ = layui.jquery,
        element = layui.element;

});

//    初始化焦点轮播
addLoadEvent(Focus());


// 折线图
//土壤水分
var myChart = echarts.init(document.getElementById('zxt1'));
// 指定图表的配置项和数据
var option = {
    title: {
        text: '土壤水分'
    },
    tooltip : {
        formatter: "{a} <br/>{b} : {c}%",
        trigger: 'axis'
    },

    toolbox: {
        show : true,
        feature : {
            mark : {show: true},
            magicType : {show: true, type: ['line', 'bar']},
            saveAsImage : {show: true}
        }
    },
    calculable : true,
    xAxis : [
        {
            type : 'category',
            boundaryGap : false,
            data: ['05-01','05-08','05-22','05-29','06-05','06-12','06-26']
        }
    ],
    yAxis : [
        {
            type: 'value',
            axisLabel : {
                formatter: '{value} %'
            },
            data: ['0','5','10','15','20','25','30','35','40','45','50']
        }
    ],
    series : [
        {
            name:'空气湿度',
            type:'line',
            stack: '总量',
            data:['5', '10', '7', '18', '17', '27','20',]
        }

    ]
};
// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option);


//光照强度
var myChart = echarts.init(document.getElementById('zxt2'));
// 指定图表的配置项和数据
var option = {
    title: {
        text: '光照强度',
    },
    tooltip: {
        trigger: 'axis'
    },
    legend: {
        data:['光照强度07','光照强度13','光照强度03']
    },
    toolbox: {
        show: true,
        feature: {
            magicType: {type: ['line', 'bar']},
            saveAsImage: {}
        }
    },
    xAxis:  {
        type: 'category',
        boundaryGap: false,
        data: ['05-01','05-08','05-22','05-29','06-05','06-12','06-26']
    },
    yAxis: {
        type: 'value',
        axisLabel: {
            formatter: '{value} k'
        }
    },
    series: [
        {
            name:'光照强度07',
            type:'line',
            data:[16, 11, 25,33, 22, 38, 20],


        },
        {
            name:'光照强度13',
            type:'line',
            data:[21, 11, 15, 33, 42, 23, 15],


        },
        {
            name:'光照强度03',
            type:'line',
            data:[1, 17, 12, 25, 33, 24, 30],

        }
    ]
};

// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option);

//    切换土壤水分和光照折线图
$(".change2").click(function(){
    $(".cz-change2").css("display","none");
    $(".cz-change1").css("display","block");
})

$(".change1").click(function(){
    $(".cz-change1").css("display","none");
    $(".cz-change2").css("display","block");
})

