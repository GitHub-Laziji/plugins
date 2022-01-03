// ==UserScript==
// @name         csdn净化
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        *://*.csdn.net/*
// @grant        none
// ==/UserScript==

(function () {
    let style = document.createElement("style");
    style.innerHTML = `
        #csdn-toolbar,
        #rightAside,
        #recommendAdBox,
        #toolBarBox,
        #recommend-right,
        #dmp_ad_58,
        #treeSkill,
        #blog_detail_zk_collection,
        #articleSearchTip,
        .operating,
        .blog-tags-box,
        .article-type-img,
        .blog_container_aside,
        .recommend-box,
        .recommend-item-box,
        .aside-box,
        .comment-box,
        .template-box,
        .blog-footer-bottom,
        .csdn-side-toolbar,
        .column-group,
        .passport-login-container,
        .hljs-button{
            display:none !important;
        }

        .main_father,main,#mainBox{
            padding: 0 !important;
            margin: 0 !important;
            width: 100% !important;
        }

        .bar-content{
            margin-left: 10px;
        }
    
        *{
            user-select: auto !important;
        }

        .copy-code{
            padding: 8px;
            position: absolute;
            top: 10px;
            right: 10px;
            background: #409EFF;
            color: #fff;
            font-size: 22px;
            font-weight: 600;
        }

        .msg{
            position: fixed;
            top: calc(50vh - 18px);
            left: calc(50vw - 50px);
            width: 100px;
            height: 36px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #fff;
            font-size: 16px;
            font-weight: 600;
            background: #67C23A;
        }
    `;
    document.head.appendChild(style);

    for (let n of document.querySelectorAll("pre[name='code']")) {
        let btn = document.createElement("button");
        btn.append("复制代码");
        btn.className = "copy-code";
        btn.onclick = () => {
            let code = n.querySelector("code")
            let input = document.createElement("textarea");
            input.value = code.innerText;
            n.append(input);
            input.select();
            document.execCommand("Copy");
            n.removeChild(input);

            let msg = document.createElement("div");
            msg.append("复制成功");
            msg.className = "msg";
            document.body.append(msg);
            setTimeout(() => {
                document.body.removeChild(msg);
            }, 500);
        }
        n.append(btn);
    }
})();