// ==UserScript==
// @name         wxpa图片打包
// @namespace    laziji
// @version      0.1
// @description  wxpa图片打包
// @author       laziji
// @match        https://mp.weixin.qq.com/cgi-bin/*
// @require      https://cdn.bootcdn.net/ajax/libs/jszip/3.6.0/jszip.min.js
// @grant        none
// ==/UserScript==

(function () {
    async function fetchBlob(fetchUrl, method = "GET", body = null) {
        const response = await window.fetch(fetchUrl, {
            method,
            body: body ? JSON.stringify(body) : null,
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json",
                "X-Requested-With": "XMLHttpRequest",
            },
        });
        const blob = await response.blob();
        return blob;
    }
    function downloadFile(url, fileName) {
        const a = document.createElement('a');
        a.style.display = 'none';
        a.href = url;
        a.download = fileName;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
    }

    let box = document.createElement("div");
    box.innerHTML = `
    <button
        class="weui-desktop-btn weui-desktop-btn_primary"
        style="position: fixed;top: 0;right: 0;"
    >打包</button>
    `;
    document.body.append(box)

    box.onclick = () => {
        let imgs = [];
        for (let item of [...document.querySelectorAll(".chat-msg-item img")]) {
            imgs.push(item.src);
        }

        const zip = new JSZip();
        for (let i = 0; i < imgs.length; i++) {
            zip.file(`p${(i + 1000 + "").substring(1)}.gif`, fetchBlob(imgs[i], "GET"));
        }

        zip.generateAsync({ type: "blob" }).then(blob => {
            const url = window.URL.createObjectURL(blob);
            downloadFile(url, `${new Date().getTime()}.zip`);
        });
    }
})();