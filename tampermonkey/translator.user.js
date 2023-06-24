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
                        reject(e);
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
                                    let transText;
                                    try {
                                        transText = JSON.parse(e.responseText)[0].translations[0].text;
                                    } catch (e) {
                                        reject(e);
                                    }
                                    let transArr = transText.split("🍕");
                                    tempTexts.forEach((v, i) => result[v] = transArr[i]);
                                    resolve(result);
                                },
                                onerror: (e) => {
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

    class DeepLTranslator {
        getName() {
            return "DeepL";
        }
        getAuth() {
            return Promise.resolve({})
        }
        translation(auth, texts) {
            let map = {};
            texts.forEach(t => { map[t] = t + "test" });
            return Promise.resolve(map)
        }
    }






    const TRANSLATOR_CLASSES = [BingTranslator, DeepLTranslator];
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
            let auth = auths[instance.getName()];
            if (auth && (!auth.timeout || new Date().getTime() - auth.time < auth.timeout * 0.8)) {
                resolve(auth);
                return;
            }
            instance.getAuth().then(auth => {
                auth.time = new Date().getTime();
                auths[instance.getName()] = auth;
                GM_setValue("AUTHS", JSON.stringify(auths));
                resolve(auth);
            }).catch(reject);
        });
    }

    let promise = getAuthPromise();

    document.addEventListener('keydown', (e) => {
        if (e.ctrlKey && e.code === "KeyQ") {
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

    let menuKeys = [];
    const initMenu = () => {
        menuKeys.forEach(key => [
            GM_unregisterMenuCommand(key)
        ])
        menuKeys = [];
        for (let name in TRANSLATOR_INSTANCE_MAPPING) {
            menuKeys.push(GM_registerMenuCommand(`${name} ${instance.getName() == name ? "✔" : ""}`, () => {
                if (instance.getName() == name) {
                    return;
                }
                GM_setValue("ACTIVE_INSTANCE_NAME", name);
                instance = TRANSLATOR_INSTANCE_MAPPING[name];
                promise = getAuthPromise();
                initMenu();
            }));
        }
    }
    initMenu();
})();