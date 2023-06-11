// ==UserScript==
// @name         ChatGPT复制Token
// @namespace    laziji
// @version      0.1
// @description  ChatGPT复制Token
// @author       laziji
// @match        https://chat.openai.com/api/auth/session
// @grant        none
// ==/UserScript==

(function() {
    'use strict';
    let data = JSON.parse(document.body.textContent);
    if(data.accessToken){
        console.log(data.accessToken);
        let btn = document.createElement("button");
        btn.innerHTML="复制";
        btn.onclick = ()=>{
            let tmp = document.createElement('textarea');
            tmp.setAttribute('readonly', 'readonly');
            tmp.value = data.accessToken;
            document.body.appendChild(tmp);
            tmp.select();
            document.execCommand('copy');
            document.body.removeChild(tmp);
            alert("复制成功");
        }
        document.body.append(btn);
    }
})();