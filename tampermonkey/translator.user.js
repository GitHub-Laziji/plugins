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

    class BingTranslator {
        getName() {
            return "Bing";
        }
        getAuth() {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: "https://cn.bing.com/translator",
                    anonymous: true,
                    nocache: true,
                    onload: (e) => {
                        let html = e.responseText;
                        let data = html.match(/params_AbusePreventionHelper\s*=\s*\[\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*]/);
                        let auth = { key: Number(data[1]), token: data[2], timeout: Number(data[3]) };
                        resolve(auth);
                    },
                    onerror: (e) => {
                        console.log("BingTranslator.getAuth() error", e);
                        reject();
                    }
                });
            });
        }
        translation(auth, texts) {
            let { key, token } = auth;
            let promise = Promise.resolve({});
            let subTextLen = 0;
            let subTexts = [];
            for (let i = 0; i < texts.length; i++) {
                subTexts.push(texts[i]);
                subTextLen += texts[i].length;
                if (i == texts.length - 1 || subTextLen + texts[i + 1].length > 4000) {
                    let tempTexts = subTexts;
                    subTexts = [];
                    subTextLen = 0;
                    promise = promise.then((result) => {
                        return new Promise((resolve, reject) => {
                            GM_xmlhttpRequest({
                                method: "POST",
                                url: "https://cn.bing.com/ttranslatev3?isVertical=1&&IG=2CB2C389B2FD46AE96301F20ACD168D1&IID=translator.5027",
                                data: `token=${token}&key=${key}&text=${encodeURIComponent(tempTexts.join("🍕"))}&fromLang=auto-detect&to=zh-Hans&tryFetchingGenderDebiasedTranslations=true`,
                                headers: {
                                    "content-type": "application/x-www-form-urlencoded"
                                },
                                anonymous: true,
                                nocache: true,
                                onload: (e) => {
                                    let transText = eval(e.responseText)[0].translations[0].text;
                                    let transArr = transText.split("🍕");
                                    tempTexts.forEach((v, i) => result[v] = transArr[i]);
                                    resolve(result);
                                },
                                onerror: (e) => {
                                    console.log("BingTranslator.translation() error", e);
                                    reject();
                                }
                            });
                        });
                    });
                }
            }
            return promise;
        }
    }





    const TRANSLATOR_CLASSES = [BingTranslator];
    const TRANSLATOR_INSTANCE_MAPPING = {};
    TRANSLATOR_CLASSES.forEach(translatorClass => {
        let ins = new translatorClass();
        TRANSLATOR_INSTANCE_MAPPING[ins.getName()] = ins;
    });

    let instance;
    if (GM_getValue("ACTIVE_INSTANCE_NAME")) {
        instance = TRANSLATOR_INSTANCE_MAPPING[GM_getValue("ACTIVE_INSTANCE_NAME")];
    } else {
        for (let name in TRANSLATOR_INSTANCE_MAPPING) {
            instance = TRANSLATOR_INSTANCE_MAPPING[name];
            GM_setValue("ACTIVE_INSTANCE_NAME", name);
        }
    }

    let auths;
    if (GM_getValue("AUTHS")) {
        auths = JSON.parse(GM_getValue("AUTHS"));
    } else {
        auths = {};
        GM_setValue("AUTHS", auths);
    }

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

    let promise = new Promise((resolve, reject) => {
        let auth = auths[instance.getName()];
        if (auth && new Date().getTime() - auth.time < auth.timeout * 0.8) {
            resolve(auth);
            console.log(auth)
            return;
        }
        instance.getAuth().then(auth => {
            auth.time = new Date().getTime();
            auths[instance.getName()] = auth;
            GM_setValue("AUTHS", JSON.stringify(auths));
            console.log(auths);
            resolve(auth);
        }).catch(reject);
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.code === "KeyQ") {
            let textMap = {};
            let texts = [];
            console.log(getSelectedNodes())
            getSelectedNodes().forEach(t => {
                console.log(t)
                if (!/[a-zA-Z]{2,}/.test(t.textContent.trim())) {
                    return;
                }
                console.log(1, t.TRANSLATION_STATUS, !t.TRANSLATION_STATUS && t.TRANSLATION_STATUS != "INIT")
                if (t.TRANSLATION_STATUS && t.TRANSLATION_STATUS != "INIT") {
                    return;
                }
                console.log(2)
                if (t.TRANSLATION_TEXT) {
                    t.TRANSLATION_STATUS = "TRANSLATED";
                    t.textContent = t.TRANSLATION_TEXT;
                    return;
                }
                console.log(3)
                t.TRANSLATION_STATUS = "TRANSLATING";
                if (!textMap[t.textContent]) {
                    textMap[t.textContent] = [];
                    texts.push(t.textContent);
                }
                console.log(4)
                textMap[t.textContent].push(t);
                return;
            });
            console.log(texts)
            if (!texts.length) {
                return;
            }
            promise = promise.then(auth => {
                return instance.translation(auth, texts).then(result => {
                    for (let text in result) {
                        let v = result[text];
                        textMap[text].forEach(t => {
                            if (v) {
                                t.TRANSLATION_TEXT = v;
                                if (t.TRANSLATION_STATUS == "TRANSLATING") {
                                    t.ORIGIN_TEXT = t.textContent;
                                    t.TRANSLATION_STATUS = "TRANSLATED";
                                    t.textContent = v;
                                }
                            } else {
                                if (t.TRANSLATION_STATUS == "TRANSLATING") {
                                    t.TRANSLATION_STATUS = "INIT";
                                }
                            }
                        })
                    }
                    return auth;
                });
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.code === "KeyW") {
            getSelectedNodes().forEach(t => {
                if (t.TRANSLATION_STATUS == "TRANSLATED") {
                    t.textContent = t.ORIGIN_TEXT;
                }
                t.TRANSLATION_STATUS = "INIT";
            });
        }
    });
})();