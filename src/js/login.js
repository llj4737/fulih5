let ajax = (options, cb) => {
    $.ajax({
        url: options.url,
        type: options.type || 'GET',
        data: JSON.stringify(options.data) || '',
        dataType: 'json',
        headers: {
            "Content-Type": "application/json;charset=utf-8"
        },
        success (result) {
            cb.call(null, result);
        },
        error (err) {
            console.log(err)
            if (err) {
                alert('登录失败')
                clear();
            }
        }
    })
}
let userData = getCurUser();  // 获取当前用户
// 清空输入框
function clear () {
    $('.username input').val('');
    $('.password input').val('');
}
// 获取当前用户
function getCurUser () {
    return localStorage.getItem('cur_user') ? JSON.parse(localStorage.getItem('cur_user')) : {};
}
/**
 * 入口函数
 */
$(function(){
    if (is_login()) {
        return checkInSuccess();
    }
    let log_options = {type: 'post', url: '/api/user/login'};
    login_deal($('.login'), log_options, login)
    let reg_options = {type: 'post', url: '/api/user/register'};
    login_deal($('.register'), reg_options, register);
    table_show();
    checkIn();
});

/**
 * 签到按钮
 */
function checkIn () {
    $('.checkIn').on('click', e => {
        let isLogin = is_login();
        if (!isLogin) return alert('当前用户还未登录, 请登录');
        // 签到成功
        checkInSuccess();
    })
}
function is_login () {
    return Object.keys(userData).length === 0 ? false : true;
}
function checkInSuccess() {
    $('#home').css('display', 'none');
    $('#welfare').css('display', 'block');
    to_welfare(); // 进入福利中心
}
/**
 * 
 * @param {*} $el 
 * @param {*} options 
 * @param {*} cb 
 * 处理登录和注册
 */
function login_deal($el, options, cb) {
    $el.on('click', e => {
        e.preventDefault();
        let username = $('.username input').val();
        let password = $('.password input').val();
        if (username === "" || password === "") return;
        options['data'] = {username, password};
        ajax(options, cb);
    })
}
// 渲染表格
function table_show () {
    let tbody = $('.tbody');
    let user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : [];
    let temp = '';
    for (let i = 0; i < user.length; i ++) {
        temp += `<tr><td>${i}</td><td>${user[i].username}</td><td>${user[i].password}</td>`
    }
    tbody.html(temp);
}
// 登录成功处理
function login(res) {
    // console.log(res)
    if (res.status === 200) {
        // alert(res.message);
        let username = $('.username input').val();
        let password = $('.password input').val();
        let data = {username, password};
        userData = data;
        localStorage.setItem('cur_user', JSON.stringify(data));
        set_storage(data);
        clear();
        table_show();
    }
}
// 设置 localStorage
function set_storage(data) {
    let user = localStorage.getItem('user') ? JSON.parse(localStorage.getItem('user')) : [];
    let keys = user.map(v => v.username);
    !keys.includes(data.username) && user.push(data);
    localStorage.setItem('user', JSON.stringify(user));
}
// 注册成功
function register(res) {
    if (res.status === 200) {
        alert(res.message);
        clear();
    }
}



