// ==UserScript==
// @name         ChatGPT
// @namespace    laziji
// @version      0.1
// @description  ChatGPT
// @author       laziji
// @match        *://wenzhang.zhuluan.com/zh-cn/*
// @grant        none
// ==/UserScript==

(function () {
    document.querySelector("#ai-btn").onclick = function () {
        localStorage.setItem("click-second4", "0");
        aiClick();
    };
})();