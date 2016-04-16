var Task = {};

/* 工具对象：自定义bind函数 */
Task.Util = {
    bind: function(fn, context) {
        var args = Array.prototype.slice.call(arguments, 0);
        return function() {
            return fn.apply(context, args);
        }
    }
};
/* 事件对象：兼容浏览器的事件方法 */
Task.EventUtil = {
    addHandler: function(element, type, handler) {
        if (element.addEventListener) {
            element.addEventListener(type, handler, false);
        } else if (element.attachEvent) {
            element.attachEvent("on" + type, handler);
        } else {
            element["on" + type] = handler;
        }
    },
    getEvent: function(event) {
        return event ? event : window.event;
    },
    getTarget: function(event) {
        return event.target || event.srcElement;
    },
    preventDefault: function(event) {
        if (event.preventDefault) {
            event.preventDefault();
        } else {
            event.returnValue = false;
        }
    },
    removeHandler: function(element, type, handler) {
        if (element.removeEventListener) {
            element.removeEventListener(type, handler, false);
        } else if (element.datachEvent) {
            element.detachEvent("on" + type, handler);
        } else {
            element["on" + type] = null;
        }
    },
    stopPropagation: function(event) {
        if (event.stopPropagation) {
            event.stopPropagation();
        } else {
            event.cancelBubble = true;
        }
    }
};


/* 日历对象：对日历组件的业务逻辑处理，包含阴历对象、节假日对象 */
Task.Calendar = {
    YEAR: [], // 年份下拉框可选年份
    WEEK: [-1, "一", "二", "三", "四", "五", "六", "日"], // 阿拉伯数字转汉字星期
    DAYSOFMONTH: [-1, 31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31], // 平年每月的天数
    myDate: new Date(),
    yearOfToday: -1, // 当前时间的年份
    monthOfToday: -1, // 当前时间的月份
    dateOfToday: -1, // 当前时间的日期
    dayOfToday: -1, // 当前时间的星期,值为阿拉伯数字,1-7
    selectedYear: -1, // 年份下拉框选中的年份
    selectedMonth: -1, //年份下拉框选中的月份
    selectedDatesBoxSolar: -1, // 日历框中被选中的阳历日期
    selectedDatesBoxLunar: -1, // 日历框中被选中的阴历日期
    selectedDatesBoxDay: -1, // 日历框中被选中的星期

    /* 
        parameter:无
        return: 无
        function: 主函数,调用各个模块初始化日历
    */
    init: function() {
        this.splitCurrentDate();
        this.setYearArr(1901, 2050);
        this.initYearBox(this.yearOfToday);
        this.initMonthBox(this.monthOfToday);
        this.initHolidayBox();
        this.showClock();
        this.initAlmanac(this.yearOfToday, this.monthOfToday, this.dateOfToday, this.dayOfToday);
        var daysDisplay = this.getCalendarArr(this.yearOfToday, this.monthOfToday);
        this.showCalendar(daysDisplay);
        this.initEvent();
    },

    /*
        parameter: 无
        return: 无
        function: 把当前时间分割年、月、日、星期赋值给Calendar的成员变量
    */
    splitCurrentDate: function() {
        if (this.myDate instanceof Date) {
            var localMyDate = this.myDate;
            this.yearOfToday = localMyDate.getFullYear();
            this.monthOfToday = localMyDate.getMonth() + 1;
            this.dateOfToday = localMyDate.getDate();
            this.dayOfToday = localMyDate.getDay();
        } else {
            throw new Error("Function Task.Calendar.init(): this.myDate is not instanceof Date!");
        }
    },
    /* 
        parameter: 无
        return: 无
        function: 时钟 
    */
    showClock: function() {
        var currentDate = new Date();
        var clock = Task.Calendar.format(currentDate, "hh:mm:ss");
        document.getElementsByClassName("m-time-monitor")[0].innerHTML = clock;
        setTimeout(arguments.callee, 500);
    },

    /*
        parameter: 年、月、日、星期  number
        return: 无
        function: 根据参数初始化右侧万年历详情的信息
    */
    initAlmanac: function(year, month, date, day) {
        this.selectedDatesBoxSolar = date;
        this.selectedDatesBoxDay = day;
        var lunarObject = this.lunarRelatedObject.getLunar(year, month, date, day);
        var firstSpan = lunarObject.lunarMonthChina + lunarObject.lunarDateChina,
            secondSpan = lunarObject.gzYear + " 【" + lunarObject.animal + "】",
            thirdSpan = lunarObject.gzMonth + " " + lunarObject.gzDate;
        var strFormat = "yyyy-MM-dd 星期w",
            formatResult = this.format(null, strFormat, arguments);
        document.getElementsByClassName("m-almanac-right-date")[0].innerHTML = formatResult;
        document.getElementsByClassName("m-almanac-right-day")[0].innerHTML = date;
        document.getElementsByClassName("m-almanac-right-lunar")[0].innerHTML = " <span>" + firstSpan + "</span><span>" + secondSpan + "</span><span>" + thirdSpan + "</span>";
    },

    /*
        parameter: 起始年份，结束年份 number
        return: 无
        function: 根据接收的参数设置YEAR数组的值
    */
    setYearArr: function(startYear, EndYear) {
        do {
            this.YEAR.push(startYear++);
        } while (startYear <= EndYear);
    },

    /*
        parameter: 所需被选中的年份 number
        return: 无
        function: 初始化设置m-year-box中的年份下拉框的值以及被选中的值
    */
    initYearBox: function(value) {
        var yearNode = document.getElementById("year");
        var year = this.YEAR,
            len = year.length,
            i = 0,
            html = "";
        do {
            if (year[i] === value) {
                this.selectedYear = year[i];
                html += "<option value=\"" + year[i] + "\" selected=\"selected\">" + year[i] + "年</option>";
            } else {
                html += "<option value=\"" + year[i] + "\">" + year[i] + "年</option>";
            }
        } while (++i < len);
        yearNode.innerHTML = html;
    },

    /*
        parameter: 所需被选中的月份
        return: 无
        function: 初始化设置m-month-box中的月份下拉框的值以及被选中的值
    */
    initMonthBox: function(value) {
        var monthNode = document.getElementById("month");
        var month = 1,
            len = 12,
            i = 0,
            html = "";
        do {
            if (month === value) {
                this.selectedMonth = month;
                html += "<option value=\"" + month + "\" selected=\"selected\">" + month + "月</option>";
            } else {
                html += "<option value=\"" + month + "\">" + month + "月</option>";
            }
        } while (++month <= len);
        monthNode.innerHTML = html;
    },

    /*
        parameter: 无
        return: 无
        function: 初始化设置m-holiday-box中的下拉框的值，无参数，“假期安排”始终被选中
    */
    initHolidayBox: function() {
        var holiday = this.holidayRelatedObject,
            myHoliday = holiday.mHolidayDateOff,
            html = "<option value=\"\">假期安排</option>";
        for (var value in myHoliday) {
            if (myHoliday[value] !== "") {
                html += "<option value=\"" + this.yearOfToday + "-" + value + "\">" + myHoliday[value] + "</option>";
            }
        }
        document.getElementById("holiday").innerHTML = html;
    },

    /* 
        parameter: 年份  number
        return: true / false  boolean
        function: 判断是否闰年 
    */
    isLeapYear: function(year) {
        if (typeof year !== "number") {
            throw new Error("Function Task.Calendar.isLeapYear(): parameter year is not number!");
        }
        return (year % 4 == 0 && ((year % 100 != 0) || (year % 400 == 0)));
    },

    /* 
        parameter: 时间 Date、转换格式 string、额外参数 Array
        return: 转换后的字符串 string
        function: 把时间转换成指定格式，如果参数时间不为Date类型，则使用额外参数
                    格式 YYYY/yyyy 表示年份  
                    MM 月份  
                    W/w 星期  
                    dd/DD 日期  
                    hh/HH 时间  
                    mm 分钟  
                    ss/SS 秒 
    */
    format: function(localDate, dateFormat, params) {
        var str = dateFormat;
        if (localDate instanceof Date) {
            var year = localDate.getFullYear(),
                month = localDate.getMonth() + 1,
                date = localDate.getDate(),
                day = localDate.getDay(),
                hours = localDate.getHours(),
                minutes = localDate.getMinutes(),
                seconds = localDate.getSeconds();
        } else {
            var year = params[0],
                month = params[1],
                date = params[2],
                day = params[3];
        }

        str = str.replace(/yyyy|YYYY/, year);
        str = str.replace(/MM/, month > 9 ? month.toString() : "0" + month);
        str = str.replace(/w|W/g, this.WEEK[day]);
        str = str.replace(/dd|DD/, date > 9 ? date.toString() : "0" + date);
        str = str.replace(/hh|HH/, hours > 9 ? hours.toString() : "0" + hours);
        str = str.replace(/mm/, minutes > 9 ? minutes.toString() : "0" + minutes);
        str = str.replace(/ss|SS/, seconds > 9 ? seconds.toString() : "0" + seconds);

        return str;
    },

    /*
        paramter: 日期1 string、日期2 string，参数均为YYYY-MM/M-DD/D格式
        return: 相差天数的绝对值 number
        function: 求两个日期之间相差天数，
    */
    daysBetweenDate: function(date1, date2) {
        var month1 = date1.substring(5, date1.lastIndexOf("-"));
        var day1 = date1.substring(date1.lastIndexOf("-") + 1, date1.length);
        var year1 = date1.substring(0, date1.indexOf("-"));

        var month2 = date2.substring(5, date2.lastIndexOf("-"));
        var day2 = date2.substring(date2.lastIndexOf("-") + 1, date2.length);
        var year2 = date2.substring(0, date2.indexOf("-"));

        var diffDays = ((Date.parse(month1 + "/" + day1 + "/" + year1) - Date.parse(month2 + "/" + day2 + "/" + year2)) / 86400000);
        return Math.abs(diffDays);
    },

    /*
        parameter: 日期 string, 参数均为YYYY-MM/M-DD/D格式
        return: 星期 number
        function: 判断某日期是星期几
    */
    whichDay: function(myDateFormatResult) {
        var startDateFormatResult = "1900-01-01";
        var diffDays = this.daysBetweenDate(startDateFormatResult, myDateFormatResult) + 1;
        var day = diffDays % 7;
        day = day === 0 ? 7 : day;
        return day;
    },

    /* 
        paramter: 年 number、月 number
        return: 天数 number
        function: 某年某月份的实际天数 
    */
    daysOfMonth: function(year, month) {
        var daysArr = this.DAYSOFMONTH,
            result = -1;
        if (month === 2) {
            if (this.isLeapYear(year) === true) {
                result = daysArr[2] + 1;
            } else {
                result = daysArr[2];
            }
        } else {
            result = daysArr[month];
        }
        return result;
    },

    /* 
        paramter: 无
        return: 无
        function: 删除m-dates-bd的子节点中具有m-selected的节点的m-selected类 
    */
    removeClassSelected: function() {
        var ele = document.getElementsByClassName("m-selected");
        if (ele.length > 0) {
            ele[0].className = ele[0].className.replace(/m-selected/, "");
        }
    },

    /* 
        paramter: 年 number、月 number、日 number、类名 string
        return: 对象 Object
        function: 根据参数设置对象的值，该对象包含阳历、阴历、节假日等所有信息，返回要显示的对象
    */
    returnCalendarObject: function(year, month, date, className) {
        var dateFormat = year + "-" + month + "-" + date,
            lunarObject = this.lunarRelatedObject.getLunar(year, month, date),
            holidayObject = this.holidayRelatedObject.judgeHoliday(year, month, date);
        return {
            year: year,
            month: month,
            solar: date,
            day: this.whichDay(dateFormat),
            className: className,
            lunarYear: lunarObject.lunarYear,
            lunarMonth: lunarObject.lunarMonth,
            lunarDate: lunarObject.lunarDate,
            lunarMonthChina: lunarObject.lunarMonthChina,
            lunarDateChina: lunarObject.lunarDateChina,
            isLeapMonth: lunarObject.isLeapMonth,
            solarTerm: lunarObject.solarTerm,
            isSolarTerm: lunarObject.isSolarTerm,
            animal: lunarObject.animal,
            gzYear: lunarObject.gzYear,
            gzMonth: lunarObject.gzMonth,
            gzDate: lunarObject.gzDate,
            holidayName: holidayObject.holidayName,
            isOff: holidayObject.isOff,
            isWork: holidayObject.isWork
        };
    },

    /*
        paramater: 年 number、月 number
        return: 要显示的日期信息的数组 Array
        function: 根据传递的年、月计算当月应该显示的日期信息的对象数组
    */
    getCalendarArr: function(year, month) {
        var preYear = month === 1 ? year - 1 : year,
            preMonth = month === 1 ? 12 : month - 1,
            nextYear = month === 12 ? year + 1 : year,
            nextMonth = month === 12 ? 1 : month + 1;
        var daysOfPreMonth = this.daysOfMonth(preYear, preMonth);
        var daysOfCurrentMonth = this.daysOfMonth(year, month);
        var myDateFormatResult = year + "-" + month + "-01";
        var firstDayOfMonth = this.whichDay(myDateFormatResult);
        myDateFormatResult = year + "-" + month + "-" + daysOfCurrentMonth;
        var finalDayOfMonth = this.whichDay(myDateFormatResult);

        var daysDisplay = [],
            total = 1;
        if (firstDayOfMonth != 1) {
            var preDiff = firstDayOfMonth - 1;
            for (var i = daysOfPreMonth; preDiff > 0; preDiff--, i--, total++) {
                var className = "m-cross-month",
                    eachObject = this.returnCalendarObject(preYear, preMonth, i, className);
                daysDisplay.unshift(eachObject);
            }
        }
        for (var i = 1; i <= daysOfCurrentMonth; i++, total++) {
            var className = "",
                eachObject = this.returnCalendarObject(year, month, i, className);
            if (i === this.selectedDatesBoxSolar) {
                if (i != this.dateOfToday) {
                    eachObject.className += " m-selected";
                } else if (this.selectedYear !== this.yearOfToday || this.selectedMonth !== this.monthOfToday) {
                    eachObject.className += " m-selected";
                }
            } else if (i === daysOfCurrentMonth && i < this.selectedDatesBoxSolar) {
                eachObject.className += " m-selected";
                this.selectedDatesBoxSolar = i;
                this.selectedDatesBoxDay = eachObject.day;
            }
            if (total === 6) {
                eachObject.className += " m-weekend";
            } else if (total === 7) {
                eachObject.className += " m-weekend m-last";
                total = 0;
            }
            if (i === this.dateOfToday && this.selectedYear === this.yearOfToday && this.selectedMonth === this.monthOfToday) {
                eachObject.className += " m-today";
            }
            daysDisplay.push(eachObject);
        }
        for (var i = 1, restLen = 42 - daysDisplay.length; i <= restLen; i++, total++) {
            var className = "m-cross-month",
                eachObject = this.returnCalendarObject(nextYear, nextMonth, i, className);
            if (total === 7) {
                eachObject.className += " m-last";
                total = 0;
            }
            daysDisplay.push(eachObject);
        }

        return daysDisplay;
    },

    /*
        paramter: 要显示的日期信息的对象数组 Array
        return:　无
        function: 根据对象数组的信息设置dom元素的子节点
    */
    showCalendar: function(objectArr) {
        var ul = document.getElementsByClassName("m-dates-bd")[0];
        var html = "";
        for (var i = 0, len = objectArr.length; i < len; i++) {
            var dataProperty = objectArr[i].year + "-" + objectArr[i].month + "-" + objectArr[i].solar + "-" + objectArr[i].day;
            var mLunarClassName = (objectArr[i].isSolarTerm === true || objectArr[i].holidayName !== "") ? "m-lunar m-solar-term" : "m-lunar";
            if (objectArr[i].holidayName !== "") {
                var mLunarText = objectArr[i].holidayName;
            } else {
                mLunarText = objectArr[i].isSolarTerm === true ? objectArr[i].solarTerm : objectArr[i].lunarDateChina;
            }
            var holidayHtml = "";
            if (objectArr[i].isOff === true) {
                holidayHtml += "<span class=\"m-border-off\">休</span>";
                objectArr[i].className += " m-holiday-off";
            } else if (objectArr[i].isWork === true) {
                holidayHtml += "<span class=\"m-border-work\">班</span>";
            }
            html += " <li data-property=" + dataProperty + " class=\"" + objectArr[i].className + "\">" + holidayHtml + "<div class=\"m-solar\">" + objectArr[i].solar + "</div><span class=\"" + mLunarClassName + "\">" + mLunarText + "</span></li>";
        }
        ul.innerHTML = html;
    },

    /* ===================================事件相关方法=============================*/
    /* 
        parameter: 方向 number  上一年=-1 下一年=1
        return: 无
        function: 根据参数确定点击上一年还是下一年按钮,显示对应日历
    */
    yearBtn: function(direct) {
        var yearArrFinalIndex = this.YEAR.length - 1;
        if (this.selectedYear - 1 < this.YEAR[0] || this.selectedYear + 1 > this.YEAR[yearArrFinalIndex]) {
            return;
        }
        this.initYearBox(this.selectedYear + direct);
        var calendarArr = this.getCalendarArr(this.selectedYear, this.selectedMonth);
        this.showCalendar(calendarArr);
        if (this.selectedDatesBoxSolar !== -1) {
            this.initAlmanac(this.selectedYear, this.selectedMonth, this.selectedDatesBoxSolar, this.selectedDatesBoxDay);
        } else {
            this.initAlmanac(this.selectedYear, this.selectedMonth, this.selectedDatesBoxSolar, this.selectedDatesBoxDay);
        }
        this.initHolidayBox();
    },


    /* 
        parameter: 方向 number 上一月=-1 下一月=1
        return: 无
        function: 根据参数确定点击上一年还是下一年按钮,显示对应日历
    */
    monthBtn: function(direct) {
        var yearArrFinalIndex = this.YEAR.length - 1;
        if (this.selectedMonth === 1 && this.selectedYear - 1 < this.YEAR[0]) {
            return;
        } else if (this.selectedMonth === 12 && this.selectedYear + 1 > this.YEAR[yearArrFinalIndex]) {
            return;
        }
        var value = this.selectedMonth + direct;
        if (value === 0) {
            value = 12;
            this.initYearBox(this.selectedYear + direct);
        } else if (value === 13) {
            value = 1;
            this.initYearBox(this.selectedYear + direct);
        }

        this.initMonthBox(value);
        var calendarArr = this.getCalendarArr(this.selectedYear, this.selectedMonth);
        this.showCalendar(calendarArr);
        if (this.selectedDatesBoxSolar !== -1) {
            this.initAlmanac(this.selectedYear, this.selectedMonth, this.selectedDatesBoxSolar, this.selectedDatesBoxDay);
        } else {
            this.initAlmanac(this.selectedYear, this.selectedMonth, this.selectedDatesBoxSolar, this.selectedDatesBoxDay);
        }
        this.initHolidayBox();
    },

    /* 
        parameter: 无
        return: 无
        function: 点击返回今天按钮的业务逻辑
    */
    returnTodayBtn: function() {
        if (this.selectedYear !== this.yearOfToday) {
            this.initYearBox(this.yearOfToday);
        }
        if (this.selectedMonth !== this.monthOfToday) {
            this.initMonthBox(this.monthOfToday);
        }
        this.removeClassSelected();
        this.selectedDatesBoxSolar = this.dateOfToday;
        this.selectedDatesBoxDay = this.dayOfToday;
        var daysDisplay = this.getCalendarArr(this.yearOfToday, this.monthOfToday);
        this.showCalendar(daysDisplay);
        this.initAlmanac(this.yearOfToday, this.monthOfToday, this.dateOfToday, this.dayOfToday);
        this.initHolidayBox();
    },

    /* 
        paramter: 无
        return: 无
        function: 使用事件代理指定事件处理程序
    */
    initEvent: function() {
        var mControlBar = document.getElementsByClassName("m-control-bar")[0],
            mDatesBd = document.getElementsByClassName("m-dates-bd")[0];
        var eventUtil = Task.EventUtil,
            util = Task.Util;
        // 点击日历上方控制栏中按钮事件,若不绑定事件处理函数的this，函数执行时this指向mControlBar
        eventUtil.addHandler(mControlBar, "click", util.bind(function() {
            var event = eventUtil.getEvent(event);
            var target = eventUtil.getTarget(event);
            switch (target.id) {
                case "preYear":
                    this.yearBtn(-1);
                    break;
                case "nextYear":
                    this.yearBtn(1);
                    break;
                case "preMonth":
                    this.monthBtn(-1);
                    break;
                case "nextMonth":
                    this.monthBtn(1);
                    break;
                case "returnToday":
                    this.returnTodayBtn();
                    break;
            }
        }, this, event));
        // 改变日历上方控制栏中下拉框的值的事件
        eventUtil.addHandler(mControlBar, "change", util.bind(function() {
            var event = eventUtil.getEvent(event);
            var target = eventUtil.getTarget(event);
            switch (target.id) {
                case "year":
                    var year = Number(document.getElementById("year").value);
                    this.initYearBox(year);
                    var calendarArr = this.getCalendarArr(this.selectedYear, this.selectedMonth);
                    this.showCalendar(calendarArr);
                    this.initAlmanac(year, this.selectedMonth, this.selectedDatesBoxSolar, this.selectedDatesBoxDay);
                    this.initHolidayBox();
                    break;
                case "month":
                    var month = Number(document.getElementById("month").value);
                    this.initMonthBox(month);
                    var calendarArr = this.getCalendarArr(this.selectedYear, this.selectedMonth);
                    this.showCalendar(calendarArr);
                    this.initAlmanac(this.selectedYear, month, this.selectedDatesBoxSolar, this.selectedDatesBoxDay);
                    this.initHolidayBox();
                    break;
                case "holiday":
                    var holidayDate = document.getElementById("holiday").value;
                    if (holidayDate !== "") {
                        var arr = holidayDate.split("-"),
                            year = Number(arr[0]),
                            month = Number(arr[1]),
                            date = Number(arr[2]);
                        this.initYearBox(year);
                        this.initMonthBox(month);
                        this.selectedDatesBoxSolar = date;
                        this.selectedDatesBoxDay = this.whichDay(holidayDate);
                        var calendarArr = this.getCalendarArr(year, month);
                        this.showCalendar(calendarArr);
                        this.initAlmanac(year, month, date, this.selectedDatesBoxDay);
                    }
                    break;
            }
        }, this, event));
        // 点击日历下方每个日期框的事件
        eventUtil.addHandler(mDatesBd, "click", util.bind(function() {
            var event = eventUtil.getEvent(event);
            var target = eventUtil.getTarget(event),
                node = target.tagName === "LI" ? target : target.parentNode,
                dataProperty = node.getAttribute("data-property").split("-"),
                year = Number(dataProperty[0]),
                month = Number(dataProperty[1]),
                date = Number(dataProperty[2]),
                day = Number(dataProperty[3]);
            this.removeClassSelected();
            node.className += " m-selected";
            this.selectedDatesBoxSolar = date;
            this.selectedDatesBoxDay = day;
            if (node.className.indexOf("m-cross-month") !== -1) {
                var yearArrFinalIndex = this.YEAR.length - 1;
                if (year < this.YEAR[0] || year > this.YEAR[yearArrFinalIndex]) {
                    return;
                }
                this.initYearBox(year);
                this.initMonthBox(month);
                var calendarArr = this.getCalendarArr(year, month);
                this.showCalendar(calendarArr);
            }
            this.initAlmanac(year, month, date, day);
        }, this, event));
    },

    /* ==================================计算农历以及节气======================== */
    lunarRelatedObject: {
        /* 
            此数据为1900~2050年的农历数据 
            1900年的数据是0x04bd8
            相当于 0000 0100 1011 1101 1000 
            从前往后记开始为第0位 第16-19位代表 是否是闰月，如果全为0代表不闰月，否则代表闰月的月份。
            第4-15位代表从1月到12月是大月还是小月，大月30天，小月29天。
            前4位代表的是闰月是大月还是小月 0为小1为大。
        */
        lunarInfo: [0x04bd8, 0x04ae0, 0x0a570, 0x054d5, 0x0d260, 0x0d950, 0x16554, 0x056a0, 0x09ad0, 0x055d2,
            0x04ae0, 0x0a5b6, 0x0a4d0, 0x0d250, 0x1d255, 0x0b540, 0x0d6a0, 0x0ada2, 0x095b0, 0x14977,
            0x04970, 0x0a4b0, 0x0b4b5, 0x06a50, 0x06d40, 0x1ab54, 0x02b60, 0x09570, 0x052f2, 0x04970,
            0x06566, 0x0d4a0, 0x0ea50, 0x06e95, 0x05ad0, 0x02b60, 0x186e3, 0x092e0, 0x1c8d7, 0x0c950,
            0x0d4a0, 0x1d8a6, 0x0b550, 0x056a0, 0x1a5b4, 0x025d0, 0x092d0, 0x0d2b2, 0x0a950, 0x0b557,
            0x06ca0, 0x0b550, 0x15355, 0x04da0, 0x0a5d0, 0x14573, 0x052d0, 0x0a9a8, 0x0e950, 0x06aa0,
            0x0aea6, 0x0ab50, 0x04b60, 0x0aae4, 0x0a570, 0x05260, 0x0f263, 0x0d950, 0x05b57, 0x056a0,
            0x096d0, 0x04dd5, 0x04ad0, 0x0a4d0, 0x0d4d4, 0x0d250, 0x0d558, 0x0b540, 0x0b5a0, 0x195a6,
            0x095b0, 0x049b0, 0x0a974, 0x0a4b0, 0x0b27a, 0x06a50, 0x06d40, 0x0af46, 0x0ab60, 0x09570,
            0x04af5, 0x04970, 0x064b0, 0x074a3, 0x0ea50, 0x06b58, 0x055c0, 0x0ab60, 0x096d5, 0x092e0,
            0x0c960, 0x0d954, 0x0d4a0, 0x0da50, 0x07552, 0x056a0, 0x0abb7, 0x025d0, 0x092d0, 0x0cab5,
            0x0a950, 0x0b4a0, 0x0baa4, 0x0ad50, 0x055d9, 0x04ba0, 0x0a5b0, 0x15176, 0x052b0, 0x0a930,
            0x07954, 0x06aa0, 0x0ad50, 0x05b52, 0x04b60, 0x0a6e6, 0x0a4e0, 0x0d260, 0x0ea65, 0x0d530,
            0x05aa0, 0x076a3, 0x096d0, 0x04afb, 0x04ad0, 0x0a4d0, 0x1d0b6, 0x0d250, 0x0d520, 0x0dd45,
            0x0b5a0, 0x056d0, 0x055b2, 0x049b0, 0x0a577, 0x0a4b0, 0x0aa50, 0x1b255, 0x06d20, 0x0ada0
        ],

        monthToChina: ["正", "二", "三", "四", "五", "六", "七", "八", "九", "十", "十一", "腊"],
        firstDayToChina: ["初", "十", "廿", "三"],
        secondDayToChina: [-1, "一", "二", "三", "四", "五", "六", "七", "八", "九", "十"],

        tianGan: ["甲", "乙", "丙", "丁", "戊", "己", "庚", "辛", "壬", "癸"],
        diZhi: ["子", "丑", "寅", "卯", "辰", "巳", "午", "未", "申", "酉", "戌", "亥"],
        animals: ["鼠", "牛", "虎", "兔", "龙", "蛇", "马", "羊", "猴", "鸡", "狗", "猪"],

        /* 农历二十节气，以地球绕太阳公转轨迹，以15度均匀分割，在1900~2100这个时间段，有以下规律：
            1.每公历月份，都有两个节气，分别在月首及月尾
            2.每个节气在月内与基准日期相差的天数为0-3天
            3.在1900~2100这201年，节气的分布种类共有69种
        */
        solarTerm: ["小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种", "夏至", "小暑", "大暑", "立秋", "处暑", "白露", "秋分", "寒露", "霜降", "立冬", "小雪", "大雪", "冬至"],
        sTermInfo: ['9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf97c3598082c95f8c965cc920f',
            '97bd0b06bdb0722c965ce1cfcc920f', 'b027097bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
            '97bcf97c359801ec95f8c965cc920f', '97bd0b06bdb0722c965ce1cfcc920f', 'b027097bd097c36b0b6fc9274c91aa',
            '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f', '97bd0b06bdb0722c965ce1cfcc920f',
            'b027097bd097c36b0b6fc9274c91aa', '9778397bd19801ec9210c965cc920e', '97b6b97bd19801ec95f8c965cc920f',
            '97bd09801d98082c95f8e1cfcc920f', '97bd097bd097c36b0b6fc9210c8dc2', '9778397bd197c36c9210c9274c91aa',
            '97b6b97bd19801ec95f8c965cc920e', '97bd09801d98082c95f8e1cfcc920f', '97bd097bd097c36b0b6fc9210c8dc2',
            '9778397bd097c36c9210c9274c91aa', '97b6b97bd19801ec95f8c965cc920e', '97bcf97c3598082c95f8e1cfcc920f',
            '97bd097bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c91aa', '97b6b97bd19801ec9210c965cc920e',
            '97bcf97c3598082c95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
            '97b6b97bd19801ec9210c965cc920e', '97bcf97c3598082c95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722',
            '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f',
            '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
            '97bcf97c359801ec95f8c965cc920f', '97bd097bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
            '97b6b97bd19801ec9210c965cc920e', '97bcf97c359801ec95f8c965cc920f', '97bd097bd07f595b0b6fc920fb0722',
            '9778397bd097c36b0b6fc9210c8dc2', '9778397bd19801ec9210c9274c920e', '97b6b97bd19801ec95f8c965cc920f',
            '97bd07f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c920e',
            '97b6b97bd19801ec95f8c965cc920f', '97bd07f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2',
            '9778397bd097c36c9210c9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bd07f1487f595b0b0bc920fb0722',
            '7f0e397bd097c36b0b6fc9210c8dc2', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
            '97bcf7f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
            '97b6b97bd19801ec9210c965cc920e', '97bcf7f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',
            '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e', '97bcf7f1487f531b0b0bb0b6fb0722',
            '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b97bd19801ec9210c965cc920e',
            '97bcf7f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
            '97b6b97bd19801ec9210c9274c920e', '97bcf7f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',
            '9778397bd097c36b0b6fc9210c91aa', '97b6b97bd197c36c9210c9274c920e', '97bcf7f0e47f531b0b0bb0b6fb0722',
            '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9210c8dc2', '9778397bd097c36c9210c9274c920e',
            '97b6b7f0e47f531b0723b0b6fb0722', '7f0e37f5307f595b0b0bc920fb0722', '7f0e397bd097c36b0b6fc9210c8dc2',
            '9778397bd097c36b0b70c9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721', '7f0e37f1487f595b0b0bb0b6fb0722',
            '7f0e397bd097c35b0b6fc9210c8dc2', '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721',
            '7f0e27f1487f595b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
            '97b6b7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',
            '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',
            '7f0e397bd097c35b0b6fc920fb0722', '9778397bd097c36b0b6fc9274c91aa', '97b6b7f0e47f531b0723b0b6fb0721',
            '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9274c91aa',
            '97b6b7f0e47f531b0723b0787b0721', '7f0e27f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',
            '9778397bd097c36b0b6fc9210c91aa', '97b6b7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',
            '7f0e397bd07f595b0b0bc920fb0722', '9778397bd097c36b0b6fc9210c8dc2', '977837f0e37f149b0723b0787b0721',
            '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f5307f595b0b0bc920fb0722', '7f0e397bd097c35b0b6fc9210c8dc2',
            '977837f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e37f1487f595b0b0bb0b6fb0722',
            '7f0e397bd097c35b0b6fc9210c8dc2', '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
            '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722', '977837f0e37f14998082b0787b06bd',
            '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd097c35b0b6fc920fb0722',
            '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',
            '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
            '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14998082b0787b06bd',
            '7f07e7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0b0bb0b6fb0722', '7f0e397bd07f595b0b0bc920fb0722',
            '977837f0e37f14998082b0723b06bd', '7f07e7f0e37f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',
            '7f0e397bd07f595b0b0bc920fb0722', '977837f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b0721',
            '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f1487f595b0b0bb0b6fb0722', '7f0e37f0e37f14898082b0723b02d5',
            '7ec967f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0722', '7f0e37f1487f531b0b0bb0b6fb0722',
            '7f0e37f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
            '7f0e37f1487f531b0b0bb0b6fb0722', '7f0e37f0e37f14898082b072297c35', '7ec967f0e37f14998082b0787b06bd',
            '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e37f0e37f14898082b072297c35',
            '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722',
            '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f149b0723b0787b0721',
            '7f0e27f1487f531b0b0bb0b6fb0722', '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14998082b0723b06bd',
            '7f07e7f0e47f149b0723b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722', '7f0e37f0e366aa89801eb072297c35',
            '7ec967f0e37f14998082b0723b06bd', '7f07e7f0e37f14998083b0787b0721', '7f0e27f0e47f531b0723b0b6fb0722',
            '7f0e37f0e366aa89801eb072297c35', '7ec967f0e37f14898082b0723b02d5', '7f07e7f0e37f14998082b0787b0721',
            '7f07e7f0e47f531b0723b0b6fb0722', '7f0e36665b66aa89801e9808297c35', '665f67f0e37f14898082b0723b02d5',
            '7ec967f0e37f14998082b0787b0721', '7f07e7f0e47f531b0723b0b6fb0722', '7f0e36665b66a449801e9808297c35',
            '665f67f0e37f14898082b0723b02d5', '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721',
            '7f0e36665b66a449801e9808297c35', '665f67f0e37f14898082b072297c35', '7ec967f0e37f14998082b0787b06bd',
            '7f07e7f0e47f531b0723b0b6fb0721', '7f0e26665b66a449801e9808297c35', '665f67f0e37f1489801eb072297c35',
            '7ec967f0e37f14998082b0787b06bd', '7f07e7f0e47f531b0723b0b6fb0721', '7f0e27f1487f531b0b0bb0b6fb0722'
        ],

        /* 
            parameter: 农历年 number、农历月 number
            return: 天数 number
            function: 返回农历某年某月的天数
        */
        monthDays: function(year, month) {
            if (month === this.leapMonthNum(year)) {
                return this.leapMonthDays(year);
            }
            return this.nonLeapMonthDays(year, month);
        },

        /* 
            paramter: 农历年 number、农历月 number
            return: 天数 number
            function: 返回非闰月的month的天数 
        */
        nonLeapMonthDays: function(year, month) {
            var result = this.lunarInfo[year - 1900] & (0x10000 >> month);
            return result !== 0 ? 30 : 29;
        },

        /* 
            paramter: 农历年份 number
            return: 天数 number
            function: 返回农历年闰月的天数 
        */
        leapMonthDays: function(year) {
            return (this.lunarInfo[year - 1900] & 0x10000) !== 0 ? 30 : 29;
        },

        /* 
            paramter: 农历年份 number
            return: 闰月的月份 number
            function: 返回闰月的月份，0代表没有 
        */
        leapMonthNum: function(year) {
            var month = this.lunarInfo[year - 1900] & 0xf;
            return month === 0 ? 0 : month;
        },

        /* 
            paramter: 农历年份 number
            return: 总天数 number
            function: 指定农历年份的整年总天数 
        */
        totalDaysOfYearInLunar: function(year) {
            var sum = 348; // 12*29 = 38;  阴历分平年、闰年；闰年有闰月，共13月；大月30天，小月29天
            for (var i = 0x8000; i > 0x8; i >>= 1) {
                sum += (this.lunarInfo[year - 1900] & i) !== 0 ? 1 : 0;
            }
            var leapMonth = this.leapMonthNum(year);
            sum += leapMonth === 0 ? 0 : this.leapMonthDays(year);
            return sum;
        },

        /* 
            parameter: 阳历年份 number、节气序号 number
            return: 阳历日期 number
            function: 查表获取阳历year年第n个节气的阳历日期，n从0开始
        */
        getSolarTerm: function(year, n) {
            var solarTermInfo = this.sTermInfo[year - 1900];
            var solarInfo = [
                parseInt('0x' + solarTermInfo.substr(0, 5)).toString(),
                parseInt('0x' + solarTermInfo.substr(5, 5)).toString(),
                parseInt('0x' + solarTermInfo.substr(10, 5)).toString(),
                parseInt('0x' + solarTermInfo.substr(15, 5)).toString(),
                parseInt('0x' + solarTermInfo.substr(20, 5)).toString(),
                parseInt('0x' + solarTermInfo.substr(25, 5)).toString()
            ];
            var solarDay = [
                solarInfo[0].substr(0, 1),
                solarInfo[0].substr(1, 2),
                solarInfo[0].substr(3, 1),
                solarInfo[0].substr(4, 2),

                solarInfo[1].substr(0, 1),
                solarInfo[1].substr(1, 2),
                solarInfo[1].substr(3, 1),
                solarInfo[1].substr(4, 2),

                solarInfo[2].substr(0, 1),
                solarInfo[2].substr(1, 2),
                solarInfo[2].substr(3, 1),
                solarInfo[2].substr(4, 2),

                solarInfo[3].substr(0, 1),
                solarInfo[3].substr(1, 2),
                solarInfo[3].substr(3, 1),
                solarInfo[3].substr(4, 2),

                solarInfo[4].substr(0, 1),
                solarInfo[4].substr(1, 2),
                solarInfo[4].substr(3, 1),
                solarInfo[4].substr(4, 2),

                solarInfo[5].substr(0, 1),
                solarInfo[5].substr(1, 2),
                solarInfo[5].substr(3, 1),
                solarInfo[5].substr(4, 2),
            ];
            return parseInt(solarDay[n]);
        },

        /* 
            paramter: 月份 number、是否闰月 boolean
            return: 农历月份的中文全称 string
            function: 农历月份转换成中文 
        */
        lunarMonthToChina: function(month, isLeapMonth) {
            var result = "";
            if (isLeapMonth === true) {
                result = ["闰", this.monthToChina[month - 1], "月"].join("");
            } else {
                result = [this.monthToChina[month - 1], "月"].join("");
            }
            return result;
        },

        /* 
            paramter: 农历日期 number
            return: 农历日期中文全称 string
            function: 阴历日期转换成中文 
        */
        lunarDateToChina: function(date) {
            var firstIndex = -1,
                secondIndex = -1;
            switch (date) {
                case 10:
                    firstIndex = 0;
                    secondIndex = 10;
                    break;
                case 20:
                    firstIndex = 2;
                    secondIndex = 10;
                    break;
                case 30:
                    firstIndex = 3;
                    secondIndex = 10;
                    break;
                default:
                    firstIndex = Math.floor(date / 10);
                    secondIndex = date % 10;
                    break;
            }
            return [this.firstDayToChina[firstIndex], this.secondDayToChina[secondIndex]].join("");
        },

        /*
            parameter: 阳历的年、月、日 number
            return: 对象 Object
            function: 将公历转换成对应农历，返回包含所有农历信息的对象
        */
        getLunar: function(year, month, date) {
            var calendar = Task.Calendar;
            var strFormat = "yyyy-MM-dd";
            // 1900-1-31是正月初一
            var startDate = calendar.format(new Date(1900, 0, 31), strFormat),
                endDate = calendar.format(new Date(year, month - 1, date), strFormat);
            var diffDays = calendar.daysBetweenDate(startDate, endDate),
                lunarYear = -1,
                lunarMonth = -1,
                lunarDate = -1;
            for (var i = 1900; i < 2051 & diffDays > 0; i++) {
                var lunarYearDays = this.totalDaysOfYearInLunar(i);
                diffDays -= lunarYearDays;
            }
            if (diffDays < 0) {
                diffDays += lunarYearDays;
                i--;
            }
            lunarYear = i; // 判断出是农历哪一年
            var leapMonth = this.leapMonthNum(lunarYear),
                isLeapMonth = false,
                lunarMonthDays = 0;
            for (var i = 1; i < 13 && diffDays > 0; i++) {
                if (leapMonth > 0 && i === (leapMonth + 1) && isLeapMonth === false) {
                    lunarMonthDays = this.leapMonthDays(lunarYear);
                    isLeapMonth = true;
                    i--;
                } else {
                    lunarMonthDays = this.nonLeapMonthDays(lunarYear, i);
                }
                if (isLeapMonth === true && i === (leapMonth + 1)) {
                    isLeapMonth = false;
                }
                diffDays -= lunarMonthDays;
            }
            //若指定日期阴历为闰月第一天或者闰月后的第一天，则需要用以下条件判断
            if (leapMonth > 0 && diffDays === 0 && i === (leapMonth + 1)) {
                if (isLeapMonth) {
                    isLeapMonth = false;
                } else {
                    isLeapMonth = true;
                    i--;
                }
            } else if (diffDays < 0) {
                diffDays += lunarMonthDays;
                i--;
            }
            lunarMonth = i; //判断出是农历哪一月
            lunarDate = diffDays + 1; //判断出是农历哪一天
            /* 计算阳历日期对应的节气 */
            var firstSolarOfMonth = this.getSolarTerm(year, month * 2 - 2),
                secondSolarOfMonth = this.getSolarTerm(year, month * 2 - 1),
                isSolarTerm = false,
                solarTerm = "";
            if (firstSolarOfMonth === date) {
                solarTerm = this.solarTerm[month * 2 - 2];
                isSolarTerm = true;
            } else if (secondSolarOfMonth === date) {
                solarTerm = this.solarTerm[month * 2 - 1];
                isSolarTerm = true;
            }
            /* 计算年、月、日天干地支与生肖 */
            /* 干支纪年、 生肖*/
            var tianGanYear = this.tianGan[(lunarYear - 4) % 10],
                diZhiYear = this.diZhi[(lunarYear - 4) % 12],
                animal = this.animals[(lunarYear - 4) % 12] + "年",
                gzYear = [tianGanYear, diZhiYear, "年"].join("");
            /*干支纪月*/
            /* 月干 = (年干代数(从1开始) * 2 + 阴历月份) % 10, 正月地支从寅开始 */
            var tianGanMonthIndex = ((lunarYear - 3) % 10 * 2 + lunarMonth) % 10 - 1,
                diZhiMonthIndex = (lunarMonth + 2) % 12 - 1,
                tianGanMonthIndex = tianGanMonthIndex === -1 ? 9 : tianGanMonthIndex,
                diZhiMonthIndex = diZhiMonthIndex === -1 ? 11 : diZhiMonthIndex;
            /* 干支纪月时，以节气交节时间决定起始的一个月，不是农历月初至月底；以下是对干支纪月的修正 */
            var lunarMonthArr = [month - 2, month - 1, month]; //每个阳历月可能包含的阴历月份
            lunarMonthArr[0] = lunarMonthArr[0] <= 0 ? lunarMonthArr[0] + 12 : lunarMonthArr[0];
            lunarMonthArr[1] = lunarMonthArr[1] <= 0 ? lunarMonthArr[1] + 12 : lunarMonthArr[1];

            if (lunarMonth === lunarMonthArr[0] && date >= firstSolarOfMonth) {
                tianGanMonthIndex = tianGanMonthIndex + 1 > 12 ? 0 : tianGanMonthIndex + 1;
                diZhiMonthIndex = diZhiMonthIndex + 1 > 12 ? 0 : diZhiMonthIndex + 1;
            } else if ((lunarMonth === lunarMonthArr[1] && date < firstSolarOfMonth) || lunarMonth === lunarMonthArr[2]) {
                tianGanMonthIndex = tianGanMonthIndex - 1 < 0 ? 11 : tianGanMonthIndex - 1;
                diZhiMonthIndex = diZhiMonthIndex - 1 < 0 ? 11 : diZhiMonthIndex - 1;
            }

            var tianGanMonth = this.tianGan[tianGanMonthIndex],
                diZhiMonth = this.diZhi[diZhiMonthIndex],
                gzMonth = [tianGanMonth, diZhiMonth, "月"].join("");
            /* 干支纪日 */
            var strFormat = "yyyy-MM-dd";
            var startDate = calendar.format(new Date(1900, 0, 1), strFormat),
                endDate = calendar.format(new Date(year, month - 1, date), strFormat);
            var diffDays = calendar.daysBetweenDate(startDate, endDate),
                tianGanDateIndex = diffDays % 10,
                diZhiDateIndex = (10 + diffDays) % 12,
                gzDate = [this.tianGan[tianGanDateIndex], this.diZhi[diZhiDateIndex], "日"].join("");
            return {
                lunarYear: lunarYear,
                lunarMonth: lunarMonth,
                lunarDate: lunarDate,
                lunarMonthChina: this.lunarMonthToChina(lunarMonth, isLeapMonth),
                lunarDateChina: this.lunarDateToChina(lunarDate),
                isLeapMonth: isLeapMonth,
                solarTerm: solarTerm,
                isSolarTerm: isSolarTerm,
                animal: animal,
                gzYear: gzYear,
                gzMonth: gzMonth,
                gzDate: gzDate
            };
        }

    },

    /* ==================================计算节假日============================== */
    holidayRelatedObject: {
        // 清明节已经包含在lunarObject的24节气中
        // 所有阳历节日
        solarHoliday: {
            "1-1": "元旦",
            "2-2": "湿地日",
            "2-14": "情人节",
            "3-8": "妇女节",
            "3-12": "植树节",
            "3-15": "消费者权益日",
            "4-1": "愚人节",
            "4-22": "地球日",
            "5-1": "劳动节",
            "5-4": "五四青年节",
            "5-12": "护士节",
            "6-1": "儿童节",
            "6-5": "环境日",
            "7-1": "建党节",
            "8-1": "建军节",
            "9-10": "教师节",
            "10-1": "国庆节",
            "12-1": "艾滋病日",
            "12-24": "平安夜",
            "12-25": "圣诞节"
        },
        // 所有阴历节日
        lunarHoliday: {
            "1-1": "春节",
            "1-15": "元宵节",
            "5-5": "端午节",
            "7-7": "七夕节",
            "7-15": "中元节",
            "8-15": "中秋节",
            "9-9": "重阳节",
            "12-8": "腊八节"
                //"12-30", "除夕"  注意除夕需要其它方法进行计算
        },
        /* 2016年部分节假日休假安排 */
        mHolidayDateOff: {
            "1-1": "元旦",
            "1-2": "",
            "1-3": "",
            "2-7": "除夕",
            "2-8": "春节",
            "2-9": "",
            "2-10": "",
            "2-11": "",
            "2-12": "",
            "2-13": "",
            "4-2": "",
            "4-3": "",
            "4-4": "清明",
            "4-30": "",
            "5-1": "劳动节",
            "5-2": "",
            "6-9": "端午节",
            "6-10": "",
            "6-11": "",
            "9-15": "中秋节",
            "9-16": "",
            "9-17": "",
            "10-1": "国庆节",
            "10-2": "",
            "10-3": "",
            "10-4": "",
            "10-5": "",
            "10-6": "",
            "10-7": ""
        },
        /* 2016年节部分假日调休安排 */
        mHolidayDateWork: {
            "2-6": "春节",
            "2-14": "春节",
            "6-12": "端午节",
            "9-18": "中秋节",
            "10-8": "国庆节",
            "10-9": "国庆节"
        },

        /*
            parameter: 阳历的年、月、日 number
            return: 对象 Object
            function: 判断今年的节假日，和对应的isOff、isWork，休、班
        */
        judgeWhichHolidayOfThisYear: function(year, month, date) {
            var lunarRelatedObject = Task.Calendar.lunarRelatedObject,
                lunarObject = lunarRelatedObject.getLunar(year, month, date),
                solarDate = [month, date].join("-"),
                lunarDate = [lunarObject.lunarMonth, lunarObject.lunarDate].join("-"),
                holidayName = "",
                isOff = false,
                isWork = false;
            if (typeof this.mHolidayDateOff[solarDate] === "string") {
                holidayName = this.mHolidayDateOff[solarDate];
                isOff = true;
            } else if (typeof this.solarHoliday[solarDate] === "string") {
                holidayName = this.solarHoliday[solarDate];
            } else if (typeof this.lunarHoliday[lunarDate] === "string") {
                holidayName = this.lunarHoliday[lunarDate];
            }
            if (isOff === false && typeof this.mHolidayDateWork[solarDate] === "string") {
                isWork = true;
            }
            return {
                holidayName: holidayName,
                isOff: isOff,
                isWork: isWork
            };
        },

        /*
            parameter: 阳历的年、月、日 number
            return: 对象 Object
            function: 判断其他年份的节假日，对应的isOff、isWork，休、班均设置为false
        */
        judgeWhichHolidayExceptThisYear: function(year, month, date) {
            var lunarRelatedObject = Task.Calendar.lunarRelatedObject,
                solarDate = [month, date].join("-"),
                holidayName = "",
                isOff = false,
                isWork = false;
            // 判断是否为阳历节日
            if (typeof this.solarHoliday[solarDate] === "string") {
                holidayName = this.solarHoliday[solarDate];
            } else {
                // 判断是否为阴历节日
                var lunarObject = lunarRelatedObject.getLunar(year, month, date),
                    lunarDate = [lunarObject.lunarMonth, lunarObject.lunarDate].join("-");
                if (typeof this.lunarHoliday[lunarDate] === "string") {
                    holidayName = this.lunarHoliday[lunarDate];
                } else if (lunarObject.lunarMonth === 12 && lunarObject.lunarDate === lunarRelatedObject.monthDays(lunarObject.lunarYear, lunarObject.lunarMonth)) {
                    holidayName = "除夕"; //除夕是春节前一天，可能是腊月29/30，需要特殊判断
                }
            }
            return {
                holidayName: holidayName,
                isOff: isOff,
                isWork: isWork
            };
        },

        /*
            parameter: 阳历的年、月、日 number
            return: 对象 Object
            function: 根据年、月、日计算节假日以及对应的休、班情况
        */
        judgeHoliday: function(year, month, date) {
            var currentYear = Number(new Date().getFullYear());
            return year === currentYear ? this.judgeWhichHolidayOfThisYear(year, month, date) : this.judgeWhichHolidayExceptThisYear(year, month, date);
        }
    }
};
