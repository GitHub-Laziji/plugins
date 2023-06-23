// ==UserScript==
// @name         Translator
// @namespace    laziji
// @version      0.1
// @description  Translator
// @author       laziji
// @include      *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// ==/UserScript==

(function () {

    const getSelectedNodes = function () {
        let range = window.getSelection().getRangeAt(0);
        let selected = range.commonAncestorContainer;
        let childNodes = [];
        if (selected instanceof Text) {
            childNodes.push(selected);
        } else {
            selected.querySelectorAll("*").forEach(e => {
                e.childNodes.forEach(t => {
                    if (!(t instanceof Text)) {
                        return;
                    }
                    if (!range.intersectsNode(t)) {
                        return;
                    }
                    let textContent = t.textContent.trim();
                    if (!textContent) {
                        return;
                    }
                    childNodes.push(t);
                });
            });
        }
        return childNodes;
    }

    let p = new Promise((r, j) => {
        let authStr = GM_getValue("auth");
        if (authStr) {
            let auth = JSON.parse(authStr);
            if (new Date().getTime() - auth.time < auth.timeout * 0.8) {
                r(auth);
                return;
            }
        }
        GM_xmlhttpRequest({
            method: "GET",
            url: "https://cn.bing.com/translator",
            anonymous: true,
            nocache: true,
            onload: (e) => {
                let html = e.responseText;
                let data = html.match(/params_AbusePreventionHelper\s*=\s*\[\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*]/);
                let auth = { key: Number(data[1]), token: data[2], timeout: Number(data[3]), time: new Date().getTime() };
                GM_setValue("auth", JSON.stringify(auth));
                r(auth);
            }
        });
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.code === "KeyQ") {
            let textMap = {};
            let textArr = [];
            getSelectedNodes().forEach(t => {
                if (!/[a-zA-Z]{2,}/.test(t.textContent.trim())) {
                    return;
                }
                if (t.TRANSLATION_STATUS == "TRANSLATING" || t.TRANSLATION_STATUS == "TRANSLATED") {
                    return;
                }
                if (t.TRANSLATION_TEXT) {
                    t.TRANSLATION_STATUS = "TRANSLATED";
                    t.textContent = t.TRANSLATION_TEXT;
                    return;
                }
                t.TRANSLATION_STATUS = "TRANSLATING";
                if (!textMap[t.textContent]) {
                    textMap[t.textContent] = [];
                    textArr.push(t.textContent);
                }
                textMap[t.textContent].push(t);
                return;
            });
            console.log(textArr)
            if (!textArr.length) {
                return;
            }
            let subTextLen = 0;
            let subTextArr = [];
            for (let i = 0; i < textArr.length; i++) {
                subTextArr.push(textArr[i]);
                subTextLen += textArr[i].length;
                if (i == textArr.length - 1 || subTextLen + textArr[i + 1].length > 4000) {
                    let tempArr = subTextArr;
                    subTextArr = [];
                    subTextLen = 0;
                    p = p.then((auth) => {
                        return new Promise((r, j) => {
                            GM_xmlhttpRequest({
                                method: "POST",
                                url: "https://cn.bing.com/ttranslatev3?isVertical=1&&IG=2CB2C389B2FD46AE96301F20ACD168D1&IID=translator.5027",
                                data: `token=${auth.token}&key=${auth.key}&text=${encodeURIComponent(tempArr.join("🍕"))}&fromLang=auto-detect&to=zh-Hans&tryFetchingGenderDebiasedTranslations=true`,
                                headers: {
                                    "content-type": "application/x-www-form-urlencoded"
                                },
                                anonymous: true,
                                nocache: true,
                                onload: (e) => {
                                    let transText = eval(e.responseText)[0].translations[0].text;
                                    let transArr = transText.split("🍕");
                                    transArr.forEach((v, i) => {
                                        textMap[tempArr[i]].forEach(t => {
                                            t.TRANSLATION_TEXT = v;
                                            if (t.TRANSLATION_STATUS == "TRANSLATING") {
                                                t.ORIGIN_TEXT = t.textContent;
                                                t.TRANSLATION_STATUS = "TRANSLATED";
                                                t.textContent = v;
                                            }
                                        });
                                    });
                                    r(auth);
                                }
                            });
                        });
                    });
                }
            }
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.code === "KeyW") {
            getSelectedNodes().forEach(t => {
                if (t.TRANSLATION_STATUS == "TRANSLATING") {
                    t.TRANSLATION_STATUS = "DISCONTINUED";
                    return;
                }
                if (t.TRANSLATION_STATUS == "TRANSLATED") {
                    t.TRANSLATION_STATUS = "INIT";
                    t.textContent = t.ORIGIN_TEXT;
                    return;
                }
            });
        }
    });
})();