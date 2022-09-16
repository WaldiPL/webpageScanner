"use strict";

let dialogTabId;

(async function(){
	const result=browser.storage.local.get("settings");
	const urlParams=new URLSearchParams(window.location.search+window.location.hash);
	dialogTabId=urlParams.get("dialogTabId")*1;
	document.getElementById("selectorInput").value=urlParams.get("selector");
	document.getElementById("selectorInput").placeholder=i18n("selectorCSS");
	document.getElementById("titlebarH1").textContent=i18n("extensionName");
	document.getElementById("inspectText").textContent=i18n("inspectText");

	let cancelBtn=document.getElementById("cancelBtn");
		cancelBtn.textContent=i18n("cancel");
		cancelBtn.addEventListener("click",cancel);
	let retryBtn=document.getElementById("retryBtn");
		retryBtn.textContent=i18n("inspectRetry");
		retryBtn.addEventListener("click",retry);
	let okBtn=document.getElementById("okBtn");
		okBtn.textContent=i18n("ok");
		okBtn.addEventListener("click",ok);

	const {settings}=await result;
	document.documentElement.className=settings.theme?settings.theme:"auto";
	document.body.removeAttribute("class");
})();

function cancel(){
	browser.runtime.sendMessage({"closeTab":true}).then(()=>{},err=>{console.warn(err);});
}

function retry(){
	browser.runtime.sendMessage({
		"byBG":true,
		"toInspect":true,
		"removeInspectDialog":true,
		"yellowOverlay":true,
		"addEvent":true
	}).then(()=>{},err=>{
		console.warn(err);
	});
}

function ok(){
	let cssSelector=document.getElementById("selectorInput").value;
	browser.runtime.sendMessage({
		"returnToDialogTab":true,
		"cssSelector":cssSelector,
		"dialogTabId":dialogTabId
	}).then(()=>{},err=>{
		console.warn(err);
	});
}
	
function i18n(e){
	return browser.i18n.getMessage(e);
}
