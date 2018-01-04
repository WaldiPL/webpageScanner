(function(){
	document.getElementById("addThis").textContent=i18n("addThis");
	document.getElementById("scanNow").textContent=i18n("scanNow");
	document.getElementById("showList").textContent=i18n("showList");
	document.getElementById("addThis").addEventListener("click",addThis);
	document.getElementById("scanNow").addEventListener("click",scanNow);
	document.getElementById("showList").addEventListener("click",showList);
	getSettings().then(s=>{
		let openSitesBtn=document.getElementById("openSites");
		if(s.autoOpen){
			openSitesBtn.className="none";
		}else{
			openSitesBtn.textContent=i18n("openWebpage");
			openSitesBtn.addEventListener("click",openSites);
		}
	});
})();

function addThis(){
	browser.tabs.query({currentWindow:true,active:true}).then(tabs=>{
		let tab=tabs[0];
		browser.runtime.sendMessage({"addThis":true,"url":tab.url,"title":tab.title,"btn":2,"favicon":tab.favIconUrl});
	});
}

function scanNow(){
	browser.runtime.sendMessage({"scanSites":true});
}

function openSites(){
	browser.runtime.sendMessage({"openSites":true});
}

function showList(){
	browser.runtime.getBrowserInfo().then(e=>{
		let version=+e.version.substr(0,2);
		if(version<57){
			browser.tabs.create({
				url:`sidebar.html`,
				active:true
			});
		}
	});
	browser.sidebarAction.open();
}

function i18n(e){
	return browser.i18n.getMessage(e);
}

function getSettings(name){
	return browser.storage.local.get('settings').then(result=>{
		return name?result.settings[name]:result.settings;
	});
}
