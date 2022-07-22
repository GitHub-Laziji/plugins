// ==UserScript==
// @name         w3cschool净化
// @namespace    laziji
// @version      0.1
// @description  w3cschool净化
// @author       laziji
// @match        *://www.w3cschool.cn/*
// @grant        none
// ==/UserScript==
let style = document.createElement("style");
style.innerHTML = `
          #header_item,
          .widget-main,
          #header,
          .sidebar-space-info,
          .feedback-btn,
          .project-operation,
          .side-widget-item.side-widget-flexible-triger.up,
          .side-widget-container.side-widget-flexible,
          .kn-btn-group.pull-right,
          .sidebar-pro-nav,
          .sidebar-menu,
          #pro-footer{
              display:none !important;
          }
  
          .left-drager{
              top: 0 !important;
          }
  
          *{
              user-select: auto !important;
          }
`;
document.head.appendChild(style);