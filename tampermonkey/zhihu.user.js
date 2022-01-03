// ==UserScript==
// @name         知乎去登陆
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
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