/**
 * Created by Qizitech on 2017/9/18.
 */
layui.use(['form','laydate'], function() {
    var form = layui.form;
    var laydate = layui.laydate;
    laydate.render({
        elem: '#date1'

    });
    laydate.render({
        elem: '#date2'
    });

})



//仪表盘
var myChart = echarts.init(document.getElementById('ec1'));
// 指定图表的配置项和数据
var option = {
    series: [
        {
            name: '空气温度',
            type: 'gauge',
            width:"200px",
            heigh:"200px",
            detail: {formatter:'{value}°C'},
//                仪表盘数字
            data: [{value: 25}]
        }
    ]

};

// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option);

var myChart = echarts.init(document.getElementById('ec2'));
// 指定图表的配置项和数据
var option = {

    series: [
        {
            name: '空气湿度',
            type: 'gauge',
            detail: {formatter:'{value}%'},
//                仪表盘数字
            data: [{value: 50}]
        }
    ]
};

// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option);
var myChart = echarts.init(document.getElementById('ec3'));
// 指定图表的配置项和数据
var option = {

    series: [
        {
            name: '土壤温度',
            type: 'gauge',
            detail: {formatter:'{value}°C'},
//                仪表盘数字
            data: [{value: 20}]
        }
    ]
};

// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option);
var myChart = echarts.init(document.getElementById('ec4'));
// 指定图表的配置项和数据
var option = {

    series: [
        {
            name: '土壤湿度',
            type: 'gauge',
            detail: {formatter:'{value}%'},
            min:5,
            max:10,
            splitNumber:5,
            data: [{value: 5}]
        },

    ]
};

// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option);



//折线图

//湿度表
var myChart = echarts.init(document.getElementById('ec5'));
// 指定图表的配置项和数据
var option = {
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
            data: ['0.00','1.00','2.00','3.00','4.00','5.00','6.00','7.00','8.00','9.00','10.00','11.00','12.00','13.00','14.00','15.00','16.00','17.00','18.00','19.00','20.00','21.00','22.00','23.00']

        }
    ],
    yAxis : [
        {
            type: 'value',
        axisLabel : {
            formatter: '{value} %'
        },
        data: ['0','10','20','30','40','50','60','70','80','90','100']

        }
    ],
    series : [
        {
            name:'空气湿度',
            type:'line',
            stack: '总量',
            data:['10', '20', '80', '70', '50', '90','100', '20', '80', '70', '50', '90','20', '80', '70', '50', '90', '20', '80', '70', '50', '90', '20', '50']


        }

    ]
};



// 使用刚指定的配置项和数据显示图表。
myChart.setOption(option);