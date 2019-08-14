/** 福利中心 */
// let is_checkIn = is_checkIn();
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
                    show_reward();
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
function show_reward() {   // 显示获得的抽奖奖励
    let cur_reward = $('.lottery-item.active').find('span').text();
    $('.sweepstakes-wrap').hide();
    $('.receive-reward').show().find('span').text(cur_reward);
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
    for (let i = 0; i < $to_see.length; i++) {
        $($to_see[i]).click(function () {
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
                        if (status == 3) {
                            let count = $('.task .my-task span').text();
                            $('.task .my-task span').text(--count);
                        }
                    }
                }
            })
        })
    }
}


function getLotteryInfo() {   // 获取抽奖信息
    $.ajax({
        type: 'get',
        url: '/api/task/lottery?username=' + userData.username,
        dataType: 'json',
        success(res) {
            let { status, result } = res;
            if (status === 200) {
                let gift = result.gift;
                // console.log(result)
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
                sign_task = task.slice(0, 1);
                list_task = task.slice(1, task.length - 1);
                ad_task = task.slice(-2);
                console.log(task)
                pending_task(task);
                cb(task);
            }
        }
    })
}
function order_deal_task(task) {
    // sign_task = task.slice(0, 1);
    // list_task = task.slice(1, task.length - 1);
    // ad_task = task.slice(-2);
    deal_siginTask(sign_task);
    deal_listTask(list_task);
    // pending_task(task);
}
//待领取
function pending_task(task) {
    let pending = task.reduce((prev, cur) => {
        return cur.status == 1 ? ++prev : prev;
    }, 0);
    $('.task .my-task span').text(pending);
}
function deal_siginTask(sign_task) {  // 处理签到任务
    let item = sign_task[0];
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
function weekend(task) {
    // console.log(task)
    // 周一到周日的签到任务
    let list = task[0].list.filter(item => item.day !== 8).sort((a, b) => a.day - b.day);
    let [list_status, list_reward] = [list.map(v => v.status), list.map(v => v.reward.coupon)];
    let days_count = 0;
    $('.cal-item').each(function (i) {
        // $(this).find('.arc > span').text('+' + list_reward[i]);
        let opacity47 = list_status[i] == 1;
        if (opacity47) {
            days_count ++;
            $(this).find('.arc').css('opacity', '0.47').parent().find('.iconfont').show();
        } 
    });
    days_continue(days_count);
}
function deal_listTask(task) {  // 处理列表任务
    let status_arr = task.map(v => v.status);
    let $btn = $('.price-item .to-see');
    for (let i = 0; i < $btn.length; i++) {
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



