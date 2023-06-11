// ==UserScript==
// @name         behance下载图片
// @namespace    laziji
// @version      0.1
// @description  behance下载图片
// @author       laziji
// @match        https://www.behance.net/*
// @grant        none
// ==/UserScript==

(function () {
    function handle(img) {
        let srcset = img.getAttribute("srcset");
        let srcsetArr = srcset.split(",");
        let src = null;
        for (let i = srcsetArr.length - 1; i >= 0; i--) {
            src = srcsetArr[i].trim().split(" ")[0];
            if (src) {
                break;
            }
        }
        if (!src) {
            return
        }
        let a = document.createElement("a")
        a.setAttribute("href", src);
        a.setAttribute("target", "_blank");
        a.setAttribute("style", `
            position: absolute;
            z-index:999;
            right: 10px;
            top: 10px;
            background: rgba(25,25,25,.65);
            color: #fff;
            font-weight: 600;
            font-size: 14px;
            display: flex;
            height: 36px;
            width: 100px;
            justify-content: center;
            align-items: center;
            border-radius: 18px;
            cursor: pointer;
            text-decoration: none;`);
        a.onclick = e => e.stopPropagation();
        a.innerHTML = "下载图片";
        img.parentElement.appendChild(a);
    }

    setInterval(() => {
        let imgs = document.querySelectorAll("#project-canvas img:not([status='processed'])");
        for (let img of imgs) {
            try {
                handle(img);
                img.setAttribute("status", "processed");
            } catch (e) {

            }
        }
    }, 1000);
})();