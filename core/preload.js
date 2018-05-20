chrome['storage']['local'].get(null, function (obj) {
    document.getElementsByTagName('html')[0].setAttribute('theme', obj.mode);
});
