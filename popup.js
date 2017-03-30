(function(){
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
	browser.runtime.sendMessage({"scanSite":true});
}

function showList(){
	browser.tabs.create({
		url:`sidebar.html`,
		active:true
	});
}