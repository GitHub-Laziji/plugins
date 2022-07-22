// ==UserScript==
// @name         csdn净化
// @namespace    laziji
// @version      0.1
// @description  csdn净化
// @author       laziji
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
            margin-left: 10px !important;
        }

        *{
            user-select: auto !important;
        }

        .copy-code{
            padding: 8px !important;
            position: absolute !important;
            top: 10px !important;
            right: 10px !important;
            background: #409EFF !important;
            color: #fff !important;
            font-size: 22px !important;
            font-weight: 600 !important;
        }

        .msg{
            position: fixed !important;
            top: calc(50vh - 18px) !important;
            left: calc(50vw - 50px) !important;
            width: 100px !important;
            height: 36px !important;
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
            color: #fff !important;
            font-size: 16px !important;
            font-weight: 600 !important;
            background: #67C23A !important;
            z-index:100 !important;
        }
    `;
    document.head.appendChild(style);

    for (let n of document.querySelectorAll("pre")) {
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