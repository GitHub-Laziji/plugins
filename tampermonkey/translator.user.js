// ==UserScript==
// @name         网页翻译
// @namespace    laziji
// @version      0.1
// @description  网页翻译
// @author       laziji
// @include      *://*/*
// @grant        GM_xmlhttpRequest
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_unregisterMenuCommand
// ==/UserScript==

(function () {

    class BingTranslator {
        static getCode() {
            return "BING";
        }
        static getName() {
            return "Bing";
        }
        static getAuth() {
            return new Promise((resolve, reject) => {
                GM_xmlhttpRequest({
                    method: "GET",
                    url: "https://www.bing.com/translator",
                    anonymous: true,
                    nocache: true,
                    onload: (e) => {
                        let html = e.responseText;
                        let data = html.match(/params_AbusePreventionHelper\s*=\s*\[\s*(\d+)\s*,\s*"([^"]+)"\s*,\s*(\d+)\s*]/);
                        let auth = {
                            key: Number(data[1]),
                            token: data[2],
                            timeout: 0,
                            region: e.finalUrl == "https://cn.bing.com/translator" ? "cn" : "www",
                            ig: (() => {
                                let s = "";
                                for (let i = 0; i < 32; i++) {
                                    s += Math.floor(Math.random() * 36).toString(36).toUpperCase();
                                }
                                return s;
                            })(),
                            iid: (() => {
                                let s = "translator.";
                                for (let i = 0; i < 4; i++) {
                                    s += Math.floor(Math.random() * 10).toString(10).toUpperCase();
                                }
                                return s;
                            })()
                        };
                        resolve(auth);
                    },
                    onerror: (e) => {
                        reject(e);
                    }
                });
            });
        }
        static translation(auth, texts) {
            let { key, token, region, ig, iid } = auth;
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
                                url: `https://${region}.bing.com/ttranslatev3?isVertical=1&IG=${ig}&IID=${iid}`,
                                data: `token=${token}&key=${key}&text=${encodeURIComponent(tempTexts.join("🍕"))}&fromLang=auto-detect&to=zh-Hans&tryFetchingGenderDebiasedTranslations=true`,
                                headers: {
                                    "content-type": "application/x-www-form-urlencoded"
                                },
                                anonymous: true,
                                nocache: true,
                                onload: (resp) => {
                                    let transText;
                                    try {
                                        transText = JSON.parse(resp.responseText)[0].translations[0].text;
                                    } catch (e) {
                                        console.log(e, resp)
                                        reject(e);
                                        return;
                                    }
                                    let transArr = transText.split("🍕");
                                    tempTexts.forEach((v, i) => result[v] = transArr[i]);
                                    resolve(result);
                                },
                                onerror: (e) => {
                                    console.log(e)
                                    reject(e);
                                }
                            });
                        });
                    });
                }
            }
            return promise;
        }
    }





    GM_registerMenuCommand("清理token缓存", () => GM_setValue("AUTHS", "{}"));

    const IS_MAC = /macintosh|mac os x/i.test(navigator.userAgent.toLowerCase());
    const TRANSLATORS = [BingTranslator];
    const TRANSLATOR_MAPPING = {};
    TRANSLATORS.forEach(translator => {
        TRANSLATOR_MAPPING[translator.getCode()] = translator;
    });

    let instance;
    if (GM_getValue("ACTIVE_INSTANCE_NAME") && TRANSLATOR_MAPPING[GM_getValue("ACTIVE_INSTANCE_NAME")]) {
        instance = TRANSLATOR_MAPPING[GM_getValue("ACTIVE_INSTANCE_NAME")];
    } else {
        instance = TRANSLATORS[0];
        GM_setValue("ACTIVE_INSTANCE_NAME", instance.getCode());
    }

    let auths;
    try {
        auths = JSON.parse(GM_getValue("AUTHS"));
    } catch (e) {
        auths = {};
        GM_setValue("AUTHS", "{}");
    }



    const getSelectedNodes = function () {
        if (window.getSelection().rangeCount == 0) {
            return [];
        }
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

    const getAuthPromise = () => {
        return new Promise((resolve, reject) => {
            let auth = auths[instance.getCode()];
            if (auth && (auth.timeout == null || auth.timeout == undefined || new Date().getTime() - auth.time < auth.timeout * 0.8)) {
                resolve(auth);
                return;
            }
            instance.getAuth().then(auth => {
                auth.time = new Date().getTime();
                auths[instance.getCode()] = auth;
                GM_setValue("AUTHS", JSON.stringify(auths));
                resolve(auth);
            }).catch(reject);
        });
    }

    let promise = getAuthPromise();

    document.addEventListener('keydown', (e) => {
        if ((IS_MAC && e.ctrlKey || !IS_MAC && e.altKey) && !e.shiftKey && e.code === "KeyQ") {
            let textMap = {};
            let texts = [];
            getSelectedNodes().forEach(t => {
                if (!/[a-zA-Z]{2,}/.test(t.textContent.trim())) {
                    return;
                }
                if (t.TRANSLATION_STATUS && t.TRANSLATION_STATUS != "INIT") {
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
                    texts.push(t.textContent);
                }
                textMap[t.textContent].push(t);
                return;
            });
            if (!texts.length) {
                return;
            }
            promise = promise.then(auth => {
                return instance.translation(auth, texts).then(result => {
                    for (let text in textMap) {
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
                }).catch(_ => {
                    for (let text in textMap) {
                        textMap[text].forEach(t => {
                            if (t.TRANSLATION_STATUS == "TRANSLATING") {
                                t.TRANSLATION_STATUS = "INIT";
                            }
                        });
                    }
                    return auth;
                });
            });
        }
    });

    document.addEventListener('keydown', (e) => {
        if ((IS_MAC && e.ctrlKey || !IS_MAC && e.altKey) && e.shiftKey && e.code === "KeyQ") {
            getSelectedNodes().forEach(t => {
                if (t.TRANSLATION_STATUS == "TRANSLATED") {
                    t.textContent = t.ORIGIN_TEXT;
                }
                t.TRANSLATION_STATUS = "INIT";
            });
        }
    });


    let menuKeys = [];
    const initMenu = () => {
        menuKeys.forEach(key => [
            GM_unregisterMenuCommand(key)
        ])
        menuKeys = [];
        for (let translator of TRANSLATORS) {
            menuKeys.push(GM_registerMenuCommand(`${translator.getName()} ${instance == translator ? "✔" : ""}`, () => {
                if (instance == translator) {
                    return;
                }
                GM_setValue("ACTIVE_INSTANCE_NAME", translator.getCode());
                instance = translator;
                promise = getAuthPromise();
                initMenu();
            }));
        }
    }
    initMenu();
})();