/** 福利中心 */
let gifts = null;
let task = null;
let sigin_task = null;
let list_task = null;
let ad_task = null;

function to_welfare() {
    get_Task(order_deal_task);
    click_lottery(); //点击抽奖
    click_toSee_btn();  // 点击任务列表按钮
}
function okSignTask() { // 签到成功, 抽奖页面
    $('.sweepstakes').show();
    $('.sweepstakes-wrap').show();
    getLotteryInfo();
    lottery_btn();
}
function lottery_btn() {  // 抽奖按钮
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
function sendRewardOk (index) {
    // let cur_gift = gift[index];
    let id = gifts._id;
    let giftid = gifts.gift[index].id;
    let status = 1;
    $.ajax({
        type: 'post',
        url: '/api/task/finishLottery',
        data: JSON.stringify({id, giftid, status}),
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        success (res) {
            if (res.status == 200) {
                show_reward();
            }
        }
    })
}
function show_reward() {   // 显示获得的抽奖奖励
    let cur_reward = $('.lottery-item.active').find('span').text();
    $('.receive-reward').show().find('span').text(cur_reward);
    $('.sweepstakes-wrap').hide();
    $('.receive-reward > .ok').click(function () {
        $('.sweepstakes').hide();
        $('.days-button').addClass('complete_checkIn').text('已签到');

    })
}
// 点击抽奖
function click_lottery() {
    $('.lottery > p').click(function () {
        okSignTask();
    })
}
// 任务列表按钮
function click_toSee_btn() {
    let $to_see = $('.to-see');
    for (let i = 0; i < $to_see.length - 1; i++) {
        $($to_see[i]).click(function () {
            console.log(list_task[i])
            let that = $(this);
            let { status, taskId, taskType, condition } = list_task[i];
            if (status == 3) return;
            condition.taskNum >= 3 && (condition.taskNum = 2);
            status = (+status + 2 / condition.taskNum) + "";
            list_task[i].status = status;
            $.ajax({
                type: 'post',
                url: '/api/task/finishTask',
                data: JSON.stringify({ status, taskId, username: userData.username }),
                headers: {
                    "Content-Type": 'application/json;charset=utf-8'
                },
                dataType: 'json',
                success(res) {
                    if (res.status == 200) {
                        btn_statusChange(status, that);
                        // if (status == 3) {
                        //     let count = $('.task .my-task span').text();
                        //     count = -- count < 0 ? 0 : count;
                        //     $('.task .my-task span').text(count);
                        // }
                        if (status == 2) {
                            setWillReceiveCountDesc();
                        }
                    }
                }
            })
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
    $.ajax({
        type: 'get',
        url: '/api/task/lottery?username=' + userData.username,
        dataType: 'json',
        success(res) {
            let { status, result } = res;
            if (status === 200) {
                gifts = result;
                if (gifts.status == 1) {
                    return show_reward();
                    
                }
                let gift = result.gift;
                console.log(gifts)
                render_lotteryTray(gift);
            }
        }
    })
}
function render_lotteryTray(gift) {  // 渲染抽奖列表
    let lottery_arr = Array.from($('.lottery-item'));
    lottery_arr.splice(4, 1);
    for (let i = 0; i < lottery_arr.length; i++) {
        if (i > gift.length - 1) continue;
        lottery_arr[i].lastElementChild.firstElementChild.innerHTML = `${gift[i].num}`;
    }
}

function get_Task(cb) {  // 获取任务
    $.ajax({
        type: 'get',
        url: '/api/task/getUserTask?username=' + userData.username,
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        dataType: 'json',
        success(res) {
            if (res.status === 200) {
                task = res.result;
                task.sort(function (a, b) {
                    return a.taskId - b.taskId;
                })
                let sign_index = task.findIndex(t => t.taskId == 11);
                sign_task = task[sign_index];  // obj
                list_task = task.slice(sign_index + 1, task.length - 1);
                ad_task = task.slice(-2);
                console.log(task)
                pending_task(task);
                cb(task, sign_index);
            }
        }
    })
}
function order_deal_task(task) {
    deal_signTask(sign_task);
    deal_listTask(list_task);
    deal_adTask(ad_task);
}
function setClickCount(count) {
    localStorage.setItem('clickCount', count);
}
function getClickCount() {
    return localStorage.getItem('clickCount') ? localStorage.getItem('clickCount') : 1;
}
function deal_adTask(ad_task) {
    let task = ad_task;
    let clickCount = 0;
    $('.to-see.ad_task').click(function () {
        let $that = $(this);
        if ((clickCount = getClickCount()) > 6) return;
        setClickCount((+clickCount) + 1);
        ad_process(clickCount);  // 显示完成的进度条
        let is_complete = task.some(t => t.condition.taskNum == clickCount);
        if (is_complete) {
            let { status, taskId } = task[task.findIndex(t => t.condition.taskNum == clickCount)];
            $.ajax({
                type: 'post',
                url: '/api/task/finishTask',
                data: JSON.stringify({ status: "2", username: userData.username, taskId }),
                headers: {
                    "Content-Type": "application/json;charset=utf-8"
                },
                success(res) {
                    // console.log(res);
                    if (res.status == 200) {
                        if (clickCount == 6) {
                            $that.text('已完成').addClass('complete');
                        }
                        ad_task = ad_task.map(v => {
                            (v.condition.taskNum == clickCount) && (v.status = "2");
                            return v;
                        });
                        deal_process(ad_task);
                        reward_btn(ad_task);
                        let pending = $('.task .my-task span').text();
                        $('.task .my-task span').text(++pending);
                    }
                }
            })
        }

    });

    deal_process();
}

function deal_process() {
    let times = ad_task.reduce((prev, cur) => cur['status'] == 2 ? ++prev : prev, 0);
    let status3 = ad_task.reduce((prev, cur) => cur['status'] == 3 ? ++prev : prev, 0);
    let count = times * 3;
    if (count == 6 || getClickCount() - 1 == 6) {
        $('.to-see.ad_task').text('已完成').addClass('complete');
    }
    if (status3 == 2) return $('.reward-btn .receive').removeClass('active').text('已领取');
    
    let clickCount = getClickCount() - 1;
    if (clickCount < count) {
        setClickCount(count + 1);
    }
    
    ad_process(getClickCount() - 1)
}
function ad_process(times) { //进度
    let $dots = $('.task-line .receive-dots').slice(1);
    let $lines = $('.task-line .receive-lines');
    for (let i = 0; i < $dots.length; i++) {
        if (i < times) {
            $($dots[i]).addClass('complete');
            $($lines[i]).addClass('complete');
        } else {
            $($dots[i]).removeClass('complete');
            $($lines[i]).removeClass('complete');
        }

    }
    if (times >= 3) {
        $('.reward-btn .receive').addClass('active');
        reward_btn(ad_task);
    }
}
function reward_btn(ad_task) { // 领奖按钮
    let count = ad_task.reduce((prev, cur) => cur.status == 2 ? ++prev : prev, 0);
    console.log(ad_task, count)
    // if (count == 0) {
    //     $('.reward-btn .receive').removeClass('active');
    //     ad_process(0)
    //     return;
    // }
    $('.reward-btn .receive').click(function () {

        if (--count < 0) return;
        let cur = ad_task[count];
        let { taskId } = cur;
        console.log(taskId)
        $.ajax({
            type: 'post',
            url: '/api/task/finishTask',
            data: JSON.stringify({ username: userData.username, taskId, status: '3' }),
            headers: {
                "Content-Type": 'application/json;charset=utf-8'
            },
            success(res) {

                if (res.status == 200) {
                    console.log(111)
                    if (count == 0) {
                        $('.reward-btn .receive').removeClass('active').text('已领取');
                        ad_process(0)
                    }
                    setWillReceiveCountDesc();
                    cur.status = '3';
                }
            }
        })

    })
}


// function getClickCount
//待领取
function pending_task(task) {
    let pending = task.reduce((prev, cur) => {
        return cur.status == 2 ? ++prev : prev;
    }, 0);
    $('.task .my-task span').text(pending);
}
function deal_signTask(sign_task) {  // 处理签到任务
    let item = sign_task;
    if (item.taskId == 11 && item.taskType === "SIGN_TASK") {  // 签到任务
        let status = item.status;
        if (status == 1) { // 未完成未领取, 自动领取
            $.ajax({
                type: 'post',
                url: '/api/task/finishTask',
                dataType: 'json',
                headers: {
                    "Content-Type": "application/json;charset=utf-8"
                },
                data: JSON.stringify({ status: "3", username: userData.username, taskId: item.taskId }),
                success(res) {
                    console.log(res)
                    if (res.status === 200) {
                        okSignTask();  // 领取成功进入抽奖页面
                        get_Task(weekend);
                    }
                }
            })
        }
        else {
            $('.days-button').addClass('complete_checkIn').text('已签到');
            get_Task(weekend);
        }
    }
    // setTimeout(function () {

    // }, 500)
}
function weekend(task, index) {
    // console.log(task)
    // 周一到周日的签到任务
    let list = task[index].list.filter(item => item.day !== 8).sort((a, b) => a.day - b.day);
    let [list_status, list_reward] = [list.map(v => v.status), list.map(v => v.reward.coupon)];
    let days_count = 0;
    $('.cal-item').each(function (i) {
        // $(this).find('.arc > span').text('+' + list_reward[i]);
        let opacity47 = list_status[i] == 1;
        if (opacity47) {
            days_count++;
            $(this).find('.arc').css('opacity', '0.47').parent().find('.iconfont').show();
        }
    });
    days_continue(days_count);

}
function deal_listTask(task) {  // 处理列表任务
    let status_arr = task.map(v => v.status);
    let $btn = $('.price-item .to-see');
    for (let i = 0; i < $btn.length - 1; i++) {
        let $cur = $($btn[i]);
        let dataId = $cur.attr('data-id');
        if (dataId != status_arr[i]) {
            btn_statusChange(status_arr[i], $cur);
        }
    }
}
function btn_statusChange(status, $cur) {
    if (status == 2) {
        $cur.text('领取').addClass('receive');
    } else if (status == 3) {
        $cur.text('已完成').addClass('complete');
    }
}

// 连续签到多少天
function days_continue(count) {
    $('.days-continue h2 span').text(count);
}



