"use strict";

document.title=browser.i18n.getMessage("extensionName")+" | "+browser.i18n.getMessage("inspectElement");

function loadPage(url,dialogTabId){
	let xhr=new XMLHttpRequest();
	xhr.open("GET",url);
	xhr.onload=function(){
		let html_data=this.responseText;
		let parser=new DOMParser(),
			doc=parser.parseFromString(html_data,"text/html"),
			base=doc.getElementsByTagName("base")[0];
		if(base){
			if(base.getAttribute("href")=="/"){
				let url2=url.split("/")[0]+"//"+url.split("/")[2]+"/";
				base.href=url2;
			}else if(!base.href.startsWith("http")){
				base.href=url;
			}
		}else{
			base=document.createElement("base");
			base.href=url;
			if(doc.head)doc.head.insertBefore(base,doc.head.firstElementChild);
		}
		document.documentElement.remove();
		document.appendChild(doc.documentElement);
		browser.runtime.sendMessage({
			"inspectMe":true,
			"dialogTabId":dialogTabId
		}).then(()=>{},err=>{console.warn(err);});
	};
	let error=function(e){
		console.warn([url,e]);
	};
	xhr.onerror=error;
	xhr.ontimeout=error;
	xhr.send(null);
}

browser.runtime.onMessage.addListener(run);
function run(m,s){
	if(m.loadXHR){
		loadPage(m.inspectUrl,m.dialogTabId);
	}
}
