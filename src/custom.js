"use strict";

(function(){
	let customDefined=customElements.get('wps-popup');
	if(!customDefined){
		class wpsPopup extends HTMLElement{
			static get observedAttributes() {
				return ["mode"];
			}
			constructor(){
				super();
				const shadow=this.attachShadow({mode:"open"});
				const style=document.createElement("style");
				style.textContent="iframe{height:100%;width:100%;display:block;position:fixed;top:0;left:0;border:0;z-index:2147483647;}";
				shadow.appendChild(style);
			}
			attributeChangedCallback() {
				const iframe=document.createElement("iframe");
				const mode=this.getAttribute("mode");
				const editId=this.getAttribute("editId");
				const selector=this.getAttribute("selector");
				const inspectMode=this.getAttribute("inspectMode");
				const dialogTabId=this.getAttribute("dialogTabId");
				if(mode==="edit"){
					iframe.src=`${browser.extension.getURL("")}dialog.html?onViewTab&edit&editId=${editId}`;
				}else if(mode==="add"){
					iframe.src=`${browser.extension.getURL("")}dialog.html?add&charset=${document.charset}`;
				} if(mode==="inspect"){
					iframe.src=`${browser.extension.getURL("")}inspectDialog.html?inspectMode=${inspectMode}&dialogTabId=${dialogTabId}&selector=${selector}`;
				}
				this.shadowRoot.appendChild(iframe);
			}
		}
		customElements.define('wps-popup', wpsPopup);
	}
})();
