// ==UserScript==
// @name         知乎去登陆
// @namespace    laziji
// @version      0.1
// @description  知乎去登陆
// @author       laziji
// @match        *://*.zhihu.com/*
// @grant        none
// ==/UserScript==

(function () {
    let style = document.createElement("style");
    style.innerHTML = `
        .Modal-wrapper{
            display:none !important;
        }
        html{
            overflow:auto !important;
        }
    `;
    document.head.appendChild(style);
})();