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
            let range = window.getSelection().getRangeAt(0);
            let selected = range.commonAncestorContainer;
            console.log(selected)
            let childNodes = [];
            if (selected instanceof Text) {
                if (!selected.TRANSLATION_STATUS || selected.TRANSLATION_STATUS == "INIT") {
                    selected.TRANSLATION_STATUS = "TRANSLATING";
                    childNodes.push(selected);
                }
            } else {
                selected.querySelectorAll("p,li,a,h1,h2,h3,h4,span,div").forEach(e => {
                    e.childNodes.forEach(t => {
                        if (!range.intersectsNode(t)) {
                            return;
                        }
                        if (t.textContent.trim().length < 3 || /^\s+$/.test(t.textContent.trim())) {
                            return;
                        }
                        if (!t.TRANSLATION_STATUS || t.TRANSLATION_STATUS == "INIT") {
                            t.TRANSLATION_STATUS = "TRANSLATING";
                            if (!(t instanceof Text)) {
                                return;
                            }
                            childNodes.push(t);
                        }
                    });
                });
            }
            if (!childNodes.length) {
                return;
            }
            console.log(childNodes)
            let textMap = {};
            let textArr = [];
            childNodes.forEach(t => {
                if (!textMap[t.textContent]) {
                    textMap[t.textContent] = [];
                    textArr.push(t.textContent);
                }
                textMap[t.textContent].push(t);
            });
            let subTextLen = 0;
            let subTextArr = [];
            for (let i = 0; i < textArr.length; i++) {
                subTextArr.push(textArr[i]);
                subTextLen += textArr[i].length;
                if (i == textArr.length - 1 || subTextLen + textArr[i + 1].length > 4000) {
                    let tempArr = subTextArr;
                    console.log(tempArr)
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
                                    console.log(e)
                                    let transText = eval(e.responseText)[0].translations[0].text;
                                    console.log(transText)
                                    transText.split("🍕").forEach((v, i) => {
                                        textMap[tempArr[i]].forEach(o => {
                                            o.TRANSLATION_STATUS = "TRANSLATED";
                                            o.ORIGIN_TEXT = o.textContent;
                                            o.textContent = v;
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
            let selected = window.getSelection().getRangeAt(0).commonAncestorContainer;
            let childNodes = [];
            if (selected instanceof Text) {
                if (selected.TRANSLATION_STATUS == "TRANSLATED") {
                    selected.TRANSLATION_STATUS = "INIT";
                    selected.textContent = selected.ORIGIN_TEXT;
                }
            } else {
                selected.querySelectorAll("p,li,a,h1,h2,h3,h4,span,div").forEach(e => {
                    e.childNodes.forEach(t => {
                        if (t.TRANSLATION_STATUS == "TRANSLATED") {
                            t.TRANSLATION_STATUS = "INIT";
                            t.textContent = t.ORIGIN_TEXT;
                        }
                    });
                });
            }
        }
    });
})();