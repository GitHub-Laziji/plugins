// ==UserScript==
// @name         csdn
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*.csdn.net/*
// @grant        none
// ==/UserScript==

let style = document.createElement("style");
    style.innerHTML=`
        #csdn-toolbar,
        #rightAside,
        #recommendAdBox,
        #toolBarBox,
        #recommend-right,
        .blog_container_aside,
        .recommend-box,
        .recommend-item-box,
        .aside-box,
        .comment-box,
        .template-box,
        .blog-footer-bottom,
        .csdn-side-toolbar,
        .column-group,
        .hljs-button{
            display:none !important;
        }

        .main_father,main,#mainBox{
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
        }

        *{
            user-select: auto !important;
        }
    `;
    document.head.appendChild(style);