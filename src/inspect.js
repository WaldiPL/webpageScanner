"use strict";

let wpsURL,wpsID,wpsType,overlay;
let wpsView=(document.URL==="about:blank")?true:false;

init();

function init(){
	overlay=document.getElementById("__wps");
	if(!overlay){
		overlay=document.createElement("div");
		overlay.id="__wps";
		document.body.appendChild(overlay);
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
	overlay.textContent=e.target.tagName;
	let off=e.target;
	let offTop=0;
	let offLeft=0;
	while(off.offsetParent){
		offTop+=off.offsetParent.offsetTop;
		offLeft+=off.offsetParent.offsetLeft;
		off=off.offsetParent;
	}
	overlay.style.height=e.target.clientHeight+"px";
	overlay.style.width=e.target.clientWidth+"px";
	overlay.style.left=e.target.offsetLeft+offLeft+"px";
	overlay.style.top=e.target.offsetTop+offTop+"px";
}

function selectElement(e){
	e.preventDefault();
	overlay.style.backgroundColor="#12bc00";
	showDialog(e.target);
	removeEvent();	
}

function showDialog(e){
	let popup=document.createElement("x-popup");
		popup.id="__wps_popup";
	let titlebar=document.createElement("x-titlebar");
		titlebar.textContent=i18n("extensionName");
	let span=document.createElement("x-span");
		span.textContent=i18n("inspectText");
	let cancel=document.createElement("x-button");
		cancel.textContent=i18n("cancel");
		cancel.classList.add("negative");
		cancel.addEventListener("click",()=>{
			if(wpsView){
				removeEvent();
				document.getElementById("__wps_popup").remove();
				overlay.remove();
				window.frameElement.ownerDocument.getElementById("editPopup").classList.remove("hidden");
			}else{
				browser.runtime.sendMessage({"closeTab":true});
			}
		});
	let retry=document.createElement("x-button");
		retry.textContent=i18n("inspectRetry");
		retry.classList.add("neutral");
		retry.addEventListener("click",()=>{
			document.getElementById("__wps_popup").remove();
			overlay.style.backgroundColor="#ffe900";
			addEvent();
		});
	let ok=document.createElement("x-button");
		ok.textContent=i18n("ok");
		ok.classList.add("positive");
		ok.addEventListener("click",()=>{
			let cssSelector=uniqueSelector(e);
			if(wpsView){
				window.frameElement.ownerDocument.getElementById("cssSelectorEdit").value=cssSelector;
				removeEvent();
				document.getElementById("__wps_popup").remove();
				overlay.remove();
				window.frameElement.ownerDocument.getElementById("editPopup").classList.remove("hidden");
			}else{
				browser.runtime.sendMessage({"selector":cssSelector,"url":wpsURL,"id":wpsID,"type":wpsType}).then(r=>{
					if(r){
						browser.runtime.sendMessage({"closeTab":true});
					}else{
						if(wpsType==="add"){
							browser.runtime.sendMessage({"addThis":true,"url":wpsURL,"title":document.title,"btn":2,"cssSelector":cssSelector}).then(()=>{
								browser.runtime.sendMessage({"closeTab":true});
							});
						}else if(wpsType==="edit"){
							browser.storage.local.get(['sites']).then(result=>{
								let sites=result.sites;
								let obj={
									paritialMode:true,
									cssSelector:cssSelector
								};
								if(sites[wpsID].url===wpsURL){
									sites[wpsID]=Object.assign(sites[wpsID],obj);
									browser.storage.local.set({sites}).then(()=>{
										browser.runtime.sendMessage({"closeTab":true});
									});
								}
							});	
						}
					}
				});
			}
		});
	let footer=document.createElement("x-footer");
	footer.appendChild(cancel);
	footer.appendChild(retry);
	footer.appendChild(ok);
	popup.appendChild(titlebar);
	popup.appendChild(span);
	popup.appendChild(footer);
	document.documentElement.appendChild(popup);
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
function run(m){
	if(m.wpsURL){
		wpsURL=m.wpsURL;
		wpsID=m.wpsID;
		wpsType=m.wpsType;
	}
}
