(function(){
	document.getElementById("addThis").textContent=i18n("addThis");
	document.getElementById("scanNow").textContent=i18n("scanNow");
	document.getElementById("showList").textContent=i18n("showList");
	document.getElementById("addThis").addEventListener("click",addThis);
	document.getElementById("scanNow").addEventListener("click",scanNow);
	document.getElementById("showList").addEventListener("click",showList);
})();

function addThis(){
	browser.tabs.query({currentWindow: true, active: true}).then(tabs=>{
		let tab=tabs[0];
		browser.runtime.sendMessage({"addThis":true,"url":tab.url,"title":tab.title,"favicon":tab.favIconUrl});
		setTimeout(()=>{
			browser.runtime.sendMessage({"listSite":true});
		},5000);
	});
}

function scanNow(){
	browser.runtime.sendMessage({"scanSites":true});
}

function showList(){
	browser.tabs.create({
		url:`sidebar.html`,
		active:true
	});
}

function i18n(e){
	return browser.i18n.getMessage(e);
}