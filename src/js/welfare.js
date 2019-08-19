/** 福利中心 */
let gifts = null;
let task = [];
let sign_task = [];
let list_task = [];
let ad_task = [];
let shouldClickMaxCount = 0;
let { userData, throttle } = require('./login');



console.log(userData)
function ajax(options) {
    return new Promise((resolve, reject) => {
        $.ajax({
            url: options.url,
            type: options.type || 'GET',
            data: JSON.stringify(options.data) || '',
            dataType: 'json',
            headers: options.headers || {
                "Content-Type": "application/json;charset=utf-8"
            },
            success(result) {
                resolve(result)
            },
            error(err) {
                console.log(err)
            }
        })
    })
}
function artTemplate(id, selector, data) {
    var html = template(id, data);
    var divResult = document.querySelector(selector);
    //这是模板循环外面的div
    divResult.innerHTML = html;
}
function init() {
    getTask(orderDealTask);
    clickLottery(); //点击抽奖

}
init();
function okSignTask() { // 签到成功, 抽奖页面
    $('.sweepstakes').show();

    getLotteryInfo();

}
function lotteryBtn() {  // 抽奖按钮
    $('.lottery-btn').on('click', function () {
        let index = 0;
        let quan = 0;
        let order = [1, 2, 5, 8, 7, 6, 3, 0];
        let $lottery_item = $('.lottery-item');
        let timer = setInterval(() => {
            $lottery_item.eq(order[index++]).addClass('active').siblings().removeClass('active');
            if (index > order.length - 1) {
                index = 0;
                if (++quan === 2) {
                    clearInterval(timer);
                    sendRewardOk(index);
                }
            }
        }, 500);
    });
    // 关闭按钮
    $('.close-btn').click(function () {
        $('.sweepstakes').hide();
        $('.days-button').addClass('complete_checkIn').text('已签到');
    })
}
// 抽奖成功, 发送成功请求, 展示抽奖结果
function sendRewardOk(index) {
    // let cur_gift = gift[index];
    let id = gifts._id;
    let giftId = gifts.gift[index].id;
    let status = 1;
    console.log({ id, giftId, status })
    let options = { type: 'post', url: '/api/task/finishLottery', data: { id, giftId, status } };
    ajax(options).then(res => {
        if (res.status == 200) {
            console.log(res)
            showReward();
        }
    })
}
function getReward() {
    return localStorage.getItem('reward') || '';
}
function setReward(value) {
    localStorage.setItem('reward', value);
}
function showReward() {   // 显示获得的抽奖奖励
    let cur_reward = $('.lottery-item.active').find('span').text();
    setReward(cur_reward);
    $('.receive-reward').show().find('span').text(cur_reward);
    $('.sweepstakes-wrap').hide();
    $('.receive-reward > .ok').click(function () {
        $('.receive-reward').hide();
        $('.sweepstakes').hide();
        $('.days-button').addClass('complete_checkIn').text('已签到');
        $('.lottery > p').text(getReward() + '金币')
    })
}

// 点击抽奖
function clickLottery() {
    $('.lottery > p').click(function () {
        okSignTask();
    })
}

// 任务列表按钮
function clickToSeeBtn() {
    var count = 0;
    let $to_see = $('#list_task .to-see');
    for (let i = 0; i < $to_see.length; i++) {
        $($to_see[i]).click(function () {
            console.log(list_task[i])
            let that = $(this);
            let { status, taskId, taskType, condition } = list_task[i];
            if (status == 2) {
                let options = { type: 'post', url: '/api/task/finishTask', data: { status: '3', taskId, username: userData.username } };
                ajax(options).then(res => {
                    console.log(res)
                    list_task[i].status = '3';
                    btnStatusChange('3', that);
                    setWillReceiveCountDesc()
                    console.log(list_task[i])
                })
                return;
            };
            if (++count == condition.taskNum) {
                let options = { type: 'post', url: '/api/task/finishTask', data: { status: '2', taskId, username: userData.username } };
                ajax(options).then(res => {
                    console.log(res)
                    list_task[i].status = '2';
                    btnStatusChange('2', that);
                    count = 0;
                    setWillReceiveCountAsc()
                    console.log(list_task[i])
                })
            }

        })
    }
}
function setWillReceiveCountAsc() {
    let count = $('.task .my-task span').text();
    $('.task .my-task span').text(++count);
}
function setWillReceiveCountDesc() {
    let count = $('.task .my-task span').text();
    count = --count < 0 ? 0 : count;
    $('.task .my-task span').text(count);
}

function getLotteryInfo() {   // 获取抽奖信息
    let options = { url: '/api/task/lottery?username=' + userData.username };
    ajax(options).then(res => {
        if (res.status == 200) {
            gifts = res.result;
            console.log(gifts)
            $('.sweepstakes-wrap').show();
            renderLotteryTray(gifts.gift);
            if (gifts.status == 1) {
                $('.lottery-item.lottery-btn').addClass('complete');
                $('.lottery-btn').unbind('click');
            }
            lotteryBtn();
        }
    })
}
function renderLotteryTray(gift) {  // 渲染抽奖列表
    let lotteryArr = new Array(9);
    artTemplate('lottery', '.lottery-box', { lotteryArr, gift })
}

function getTask(cb) {  // 获取任务
    let options = { url: '/api/task/getUserTask?username=' + userData.username };
    ajax(options).then(res => {
        if (res.status == 200) {
            task = res.result;
            devideTask(task);
            console.log(sign_task, list_task, ad_task)
            pendingTask(task);
            cb();
        }
    })
}
function devideTask(task) {
    let [curSignTask, curListTask, curAdTask] = [[], [], []];
    for (var i = 0; i < task.length; i++) {
        let taskId = task[i].taskId;
        if (taskId == 11) {
            curSignTask.push(task[i]);
        } else if (taskId == 16 || taskId == 17) {
            curAdTask.push(task[i]);
        } else {
            curListTask.push(task[i]);
        }
    }
    [sign_task, list_task, ad_task] = [curSignTask, curListTask, curAdTask];
}
function renderListTemplate() {
    let imgList = ['广告', '更新', '免费专区复制', '免费专区', '阅读计划'];
    artTemplate('tpl-user', '#list_task', { list_task, imgList });
    clickToSeeBtn();  // 点击任务列表按钮
    dealListTask(list_task);
}
function orderDealTask() {
    renderListTemplate();  // 渲染列表任务模板
    dealSignTask(sign_task);  // 处理签到任务
    dealAdTask(ad_task);  // 处理广告任务
    dealProcess();  // 处理广告任务进度条
    rewardBtn(ad_task);
}
function setClickCount(count) {
    localStorage.setItem('clickCount', count);
}
function getClickCount() {
    return localStorage.getItem('clickCount') ? localStorage.getItem('clickCount') : 1;
}
function dealAdTask(ad_task) {
    let task = ad_task;
    let clickCount = 0;
    shouldClickMaxCount = Math.max.apply(null, ad_task.map(v => v.condition.taskNum))
    $('.to-see.ad_task').click(function () {
        if ((clickCount = getClickCount()) > shouldClickMaxCount) return;
        setClickCount((+clickCount) + 1);
        adProcess(clickCount);  // 显示完成的进度条
        let is_complete = task.some(t => t.condition.taskNum == clickCount);
        if (is_complete) {
            let curAdTask = task[task.findIndex(t => t.condition.taskNum == clickCount)]
            let { status, taskId } = curAdTask;
            let options = { type: 'post', url: '/api/task/finishTask', data: { status: "2", username: userData.username, taskId } };
            ajax(options).then(res => {
                if (res.status == 200) {
                    // ad_task = ad_task.map(v => {
                    //     (v.condition.taskNum == clickCount) && (v.status = "2");
                    //     return v;
                    // });
                    curAdTask['status'] = '2';
                    dealProcess(ad_task);
                    rewardBtn(ad_task);
                    setWillReceiveCountAsc();
                }
            })
        }

    });
}
//处理进度条
function dealProcess() {
    let times = ad_task.reduce((prev, cur) => cur['status'] == 2 ? ++prev : prev, 0);
    let status3 = ad_task.reduce((prev, cur) => cur['status'] == 3 ? ++prev : prev, 0);
    let count = times * 3;

    conditions();
    if (count == shouldClickMaxCount || getClickCount() - 1 == shouldClickMaxCount) {
        $('.to-see.ad_task').text('已完成').addClass('complete');
    }
    if (status3 == 2) {
        $('.reward-btn .receive').removeClass('active').text('已领取');
    }
    let status1 = ad_task.reduce((prev, cur) => cur['status'] == 1 ? ++prev : prev, 0);
    if (status1 == 0) {
        $('.to-see.ad_task').text('已完成').addClass('complete');
        $('.to-see.ad_task').unbind('click')
    }

    let clickCount = getClickCount() - 1;
    if (clickCount < count) {
        setClickCount(count + 1);
    }
    if (times >= 1) {
        $('.reward-btn .receive').addClass('active');
    }

    adProcess(getClickCount() - 1)
}
function conditions() {
    let i = ad_task.findIndex(v => v.condition.taskNum == shouldClickMaxCount);
    $('.reward-btn span').eq(0).text(ad_task[i].condition.taskNum);
    $('.reward-btn span').eq(1).text(ad_task[i].reward.coupon);
}
function adProcess(times) { //渲染进度条
    if (times < 0) return;
    let timeLines = new Array(shouldClickMaxCount);
    let rewardDots = ad_task.map(v => v.condition.taskNum);
    console.log(rewardDots)
    artTemplate('process', '.task-line', { timeLines, times, rewardDots })
}
function rewardBtn(ad_task) { // 领奖按钮
    let count = ad_task.reduce((prev, cur) => cur.status == 2 ? ++prev : prev, 0);
    console.log(ad_task, count)
    if (count > 0) {
        $('.reward-btn .receive').addClass('active');
    }
    $('.reward-btn .receive').unbind('click')
    $('.reward-btn .receive').click(throttle(function(){
            console.log(111)
            ad_task = ad_task.filter(v => v.status == 2);
            if (--count < 0) return;
            let cur = ad_task[count];
            let { taskId } = cur;
            console.log(taskId)
            let options = { type: 'post', url: '/api/task/finishTask', data: { username: userData.username, taskId, status: '3' } };
            ajax(options).then(res => {
                if (res.status == 200) {
                    console.log(111)
                    setClickCount(getClickCount() - 3);
                    if (count == 0) {
                        $('.reward-btn .receive').removeClass('active').text('已领取');
                    }
                    console.log(count)
                    adProcess(count * 3)
                    setWillReceiveCountDesc();
                    cur.status = '3';
                    console.log(ad_task, 'ad_task')
                }
            })
    }, 1000))
}


//待领取
function pendingTask(task) {
    let pending = task.reduce((prev, cur) => {
        return cur.status == 2 ? ++prev : prev;
    }, 0);
    $('.task .my-task span').text(pending);
}
function dealSignTask(sign_task) {  // 处理签到任务
    let item = sign_task[0];
    if (item.taskId == 11 && item.taskType === "SIGN_TASK") {  // 签到任务
        let status = item.status;
        if (status == 1) { // 未完成未领取, 自动领取
            let options = { type: 'post', url: '/api/task/finishTask', data: { status: "3", username: userData.username, taskId: item.taskId } };
            ajax(options).then(res => {
                if (res.status == 200) {
                    okSignTask();  // 领取成功进入抽奖页面
                    getTask(weekend);
                    // weekend();
                }
            })
        }
        else {
            $('.days-button').addClass('complete_checkIn').text('已签到');
            getTask(weekend);

            // weekend();
        }
    }
}
function weekend() {
    // 周一到周日的签到任务
    let list = sign_task[0].list;
    let daysCount = list.reduce((prev, { status }) => status == 0 ? prev : ++prev, 0);
    let weekendArr = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
    artTemplate('checkIn', '.checkInEveryDay', { list, weekendArr });
    daysContinue(daysCount);
}
function dealListTask(task) {  // 处理列表任务
    let statusArr = task.map(v => v.status);
    let $btn = $('#list_task .to-see');
    for (let i = 0; i < $btn.length; i++) {
        let $cur = $($btn[i]);
        let dataId = $cur.attr('data-id');
        if (dataId != statusArr[i]) {
            btnStatusChange(statusArr[i], $cur);
        }
    }
}
function btnStatusChange(status, $cur) {
    if (status == 2) {
        $cur.text('领取').addClass('receive');
    } else if (status == 3) {
        $cur.text('已完成').addClass('complete');
    }
}

// 连续签到多少天
function daysContinue(count) {
    $('.days-continue h2 span').text(count);
}


$('#welfare #back').click(function () {
    location.href = "/"
})



