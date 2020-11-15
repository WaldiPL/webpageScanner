"use strict";

let inspectMode,overlay,dialogTabId;

function init(){
	overlay=document.getElementById("__wps_inspectOverlay");
	if(!overlay){
		overlay=document.createElement("wps-overlay");
		overlay.id="__wps_inspectOverlay";
		document.documentElement.appendChild(overlay);
		addEvent();
	}
}

function addEvent(){
	document.body.addEventListener("mouseover",highlightElement);
	document.body.addEventListener("click",selectElement);
}

function removeEvent(){
	document.body.removeEventListener("mouseover",highlightElement);
	document.body.removeEventListener("click",selectElement);
}

function highlightElement(e){
	let rect=e.target.getBoundingClientRect();
	overlay.textContent=e.target.tagName;
	overlay.style.height=rect.height+"px";
	overlay.style.width=rect.width+"px";
	overlay.style.left=rect.left+window.scrollX+"px";
	overlay.style.top=rect.top+window.scrollY+"px";
}

function selectElement(e){
	e.preventDefault();
	overlay.style.backgroundColor="#12bc00";
	showDialog(e.target);
	removeEvent();	
}

function showDialog(e){
	if(!document.getElementById("__wps_inspectDialog")){
		browser.runtime.sendMessage({"executeCustom":true}).then(()=>{
			let popup=document.createElement("wps-popup");
				popup.id="__wps_inspectDialog";
				popup.setAttribute("selector",uniqueSelector(e));
				popup.setAttribute("inspectMode",inspectMode);
				popup.setAttribute("dialogTabId",dialogTabId);
				popup.setAttribute("mode","inspect");
				document.documentElement.appendChild(popup);
		},err=>{
			console.warn(err);
		});
	}
}

function uniqueSelector(e){
	let selector="",
		cu=e,
		noID=true;
	if(e.tagName==="HTML"){
		selector=`HTML`;
	}else{
		while(cu.parentElement&&noID){
			if(cu.id){
				noID=false;
				selector=`> #${cu.id} ${selector}`;
			}else{
				let nth=1;
				if(cu.previousElementSibling){
					let prev=cu;
					if(cu.previousElementSibling.id){
						selector=`> #${cu.previousElementSibling.id} + ${cu.tagName} ${selector}`;
						noID=false;
					}else{
						while(prev.previousElementSibling){
							prev=prev.previousElementSibling;
							nth++;
						}
						selector=`> ${cu.tagName}:nth-child(${nth}) ${selector}`;
					}
				}else{
					selector=`> ${cu.tagName}:nth-child(1) ${selector}`;
				}
				cu=cu.parentElement;
			}
		}
		selector=selector.substr(2);
	}
	return selector;
}

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}

browser.runtime.onMessage.addListener(run);
function run(m,s){
	if(m.initInspect){
		inspectMode=m.inspectMode;
		dialogTabId=m.dialogTabId;
		init();
	}
	if(m.toInspect){
		if(m.addEvent){
			addEvent();
		}
		if(m.removeEvent){
			removeEvent();
		}
		if(m.removeInspectDialog){
			document.getElementById("__wps_inspectDialog").remove();
		}
		if(m.removeOverlay){
			overlay.remove();
		}
		if(m.yellowOverlay){
			overlay.style.backgroundColor="#ffe900";
		}
	}
}
