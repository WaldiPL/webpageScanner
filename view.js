var localId;
const extURL=browser.extension.getURL("");

(function(){
	const urlString=window.location.search;
	localId=parseInt(urlString.substr(1));
	translate();
	document.getElementById("oldHtml10153").addEventListener("click",()=>{load(localId,"oldHtml");});
	document.getElementById("newHtml10153").addEventListener("click",()=>{load(localId,"newHtml");});
	document.getElementById("news10153").addEventListener("click",()=>{load(localId,"news");});
	document.getElementById("light10153").addEventListener("click",()=>{load(localId,"light");});
	document.getElementById("active10153").addEventListener("click",()=>{load(localId,"active");});
	document.getElementById("delete10153").addEventListener("click",()=>{showDelete(localId);});
	document.getElementById("deleteCancel10153").addEventListener("click",e=>{e.target.offsetParent.classList.add("hidden");});
	document.getElementById("edit10153").addEventListener("click",()=>{showEdit(localId);});
	document.getElementById("editCancel10153").addEventListener("click",e=>{e.target.offsetParent.classList.add("hidden");});
	getSettings().then(s=>{
		load(localId,s.defaultView);
		if(s.hideHeader)toogleHeader(true);
	});
	document.getElementById("toogleHeader10153").addEventListener("click",()=>{toogleHeader();});
})();

function showDelete(e){
	document.getElementById("editingSite10153").classList.add("hidden");
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		document.getElementById("deleteSite10153").addEventListener("click",()=>{deleteSite(e);});
		document.getElementById("deletingSite10153").classList.remove("hidden");
		document.getElementById("deleteTitle10153").textContent=sites[e].title;
	});
}

function deleteSite(e){
	browser.storage.local.get(['sites','changes']).then(result=>{
		let sites=result.sites,
			changes=result.changes;
		sites.splice(e,1);
		changes.splice(e,1);
		browser.storage.local.set({sites:sites,changes:changes});
	}).then(()=>{
		browser.runtime.sendMessage({"listSite":true,"deletedSite":true,"id":e});
		browser.tabs.getCurrent().then(tab=>{browser.tabs.remove(tab.id);});
	});
}

function showEdit(e){
	document.getElementById("deletingSite10153").classList.add("hidden");
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		document.getElementById("editSite10153").addEventListener("click",()=>{editSite(e);});
		document.getElementById("editingSite10153").classList.remove("hidden");
		document.getElementById("eUrl10153").value=sites[e].url;
		document.getElementById("eTitle10153").value=sites[e].title;
		document.getElementById("eCharset10153").value=sites[e].charset?sites[e].charset:"uft-8";
		document.getElementById("eFreq10153").value=sites[e].freq;
		document.getElementById("eMode10153").value=sites[e].mode;
	});
}

function editSite(e){
	document.getElementById("editingSite10153").classList.add("hidden");
	browser.storage.local.get('sites').then(result=>{
		let sites=result.sites;
		let obj={
			title:	document.getElementById("eTitle10153").value,
			url:	document.getElementById("eUrl10153").value,
			mode:	document.getElementById("eMode10153").value,
			favicon:"https://icons.better-idea.org/icon?size=16..16..16&url="+document.getElementById("eUrl10153").value,
			freq:	parseInt(document.getElementById("eFreq10153").value),
			charset:document.getElementById("eCharset10153").value?document.getElementById("eCharset10153").value:"utf-8"
		}
		document.getElementById("title10153").textContent=obj.title;
		sites[e]=Object.assign(sites[e],obj);
		browser.storage.local.set({sites});
	}).then(()=>{
		browser.runtime.sendMessage({"listSite":true});
	});
}

function setTitle(){
	const metaTitles=document.getElementsByTagName("title"),
		  metaTitle=metaTitles[metaTitles.length-1],
		  userTitle=document.getElementById("title10153").textContent,
		  docTitle=document.title;
	if(docTitle=="")document.title=userTitle;
	else if(docTitle!=metaTitle.textContent)document.title=metaTitle.textContent;
}

function load(siteId,type){
	btnActive(type);
	browser.storage.local.get(['sites','changes']).then(result=>{
		const sites=result.sites,
			  changes=result.changes,
			  sId=sites[siteId],
			  cId=changes[siteId],
			  newHtml=cId.html,
			  oldHtml=cId?cId.oldHtml:"",
			  diffString=diffString2(oldHtml,newHtml),
			  light=cId?diffString.n:newHtml,
			  news=cId?diffString.c:"",
			  url=sId.url.split("/"),
			  url2=url[0]+"//"+url[2]+"/";
		document.getElementById("title10153").textContent=sId.title;
		document.getElementById("lastScan10153").textContent=i18n("lastScan",[realDate(sId.date),realTime(sId.time)]);
		switch(type){
			case "light":
				document.getElementById("content10153").innerHTML=light;
				break;
			case "news":
				document.getElementById("content10153").innerHTML=news;
				break;
			case "newHtml":
				document.getElementById("content10153").innerHTML=newHtml;
				break;
			case "oldHtml":
				document.getElementById("content10153").innerHTML=oldHtml;
				break;
			case "active":
				window.location=sId.url;
				break;
		}
		setTitle();
		const a=document.getElementsByTagName("a"),
			  img=document.getElementsByTagName("img"),
			  meta=document.getElementsByTagName("link");
		setTimeout(function(){
			const extUrl=browser.extension.getURL("");
			[...a].forEach(value=>{
				if(value.href.includes(extUrl))value.href=value.href.replace(extUrl,url2);
				if(value.href.includes("moz-extension://"))value.href=value.href.replace("moz-extension://","http://");
			});
			[...img].forEach(value=>{
				if(value.id!="icon10153"&&value.id!="toogleHeader10153"){
					if(value.src.includes(extUrl))value.src=value.src.replace(extUrl,url2);
					if(value.src.includes("moz-extension://"))value.src=value.src.replace("moz-extension://","http://");
				}
			});
			[...meta].forEach(value=>{
				if(value.id!="diff10153"){
					if(value.href.includes(extUrl))value.href=value.href.replace(extUrl,url2);
					if(value.href.includes("moz-extension://"))value.href=value.href.replace("moz-extension://","http://");
				}
			});
		},50);
	});
}

function btnActive(type){
	if(type==="active")return;
	document.getElementById("oldHtml10153").classList.remove("active10153");
	document.getElementById("newHtml10153").classList.remove("active10153");
	document.getElementById("news10153").classList.remove("active10153");
	document.getElementById("light10153").classList.remove("active10153");
	document.getElementById(type+"10153").classList.add("active10153");
}

function realDate(e){
	const m=Math.trunc(e),
		  month=i18n("monthList").split(","),
		  d=Math.round((e-m)*100);
	return `${d} ${month[m]}`;
}

function realTime(e){
	e+="";
	let h=e.split(".")[0],
		m=e.split(".")[1];
	m=m?m:"00";
	h=h.length===1?"0"+h:h;
	m=m.length===1?m+"0":m.substr(0,2);
	return `${h}:${m}`;
}

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}

browser.runtime.onMessage.addListener(run);
function run(m){
	if(m.deletedSite){
		let dId=parseInt(m.id);
		if(dId===localId){
			browser.tabs.getCurrent().then(tab=>{browser.tabs.remove(tab.id);});
		}else if(dId<localId){
			window.location=browser.runtime.getURL("view.html")+"?"+(localId-1);
		}
	}
}

function translate(){
	document.getElementById("edit10153").textContent=i18n("edit");
	document.getElementById("delete10153").textContent=i18n("delete");
	document.getElementById("oldHtml10153").textContent=i18n("oldVersion");
	document.getElementById("newHtml10153").textContent=i18n("newVersion");
	document.getElementById("news10153").textContent=i18n("newElements");
	document.getElementById("light10153").textContent=i18n("highlight");
	document.getElementById("active10153").textContent=i18n("currentWebpage");
	document.getElementById("deleteCancel10153").textContent=i18n("cancel");
	document.getElementById("deleteSite10153").textContent=i18n("delete");
	document.getElementById("editCancel10153").textContent=i18n("cancel");
	document.getElementById("editSite10153").textContent=i18n("save");
	document.getElementById("deleteB10153").textContent=i18n("deleteWebpage");
	document.getElementById("editB10153").textContent=i18n("editWebpage");
	document.getElementById("address10153").textContent=i18n("address");
	document.getElementById("titleE10153").textContent=i18n("title");
	document.getElementById("charset10153").textContent=i18n("charset");
	document.getElementById("scanFreq10153").textContent=i18n("scanFreq");
	document.getElementById("modeTitle10153").textContent=i18n("modeTitle");
	let selectFreq=document.getElementById("eFreq10153").options;
		selectFreq[0].text=i18n("1Hour");
		selectFreq[1].text=i18n("4Hours");
		selectFreq[2].text=i18n("8Hours");
		selectFreq[3].text=i18n("12Hours");
		selectFreq[4].text=i18n("24Hours");
	let selectMode=document.getElementById("eMode10153").options;
		selectMode[0].text=i18n("modeM0");
		selectMode[1].text=i18n("modeM3");
		selectMode[2].text=i18n("modeM4");
		selectMode[3].text=i18n("modeM1");
		selectMode[4].text=i18n("modeM2");
	document.getElementById("toogleHeader10153").title=i18n("hideInterface");
}

function getSettings(name){
	return browser.storage.local.get('settings').then(result=>{
		return name?result.settings[name]:result.settings;
	});
}

function toogleHeader(auto){
	let body=document.body,
		arrow=document.getElementById("toogleHeader10153"),
		hidd=body.classList.contains("hiddenHeader10153");
	if(!hidd||auto){
		body.className=auto?"hiddenHeader10153 autoHidden10153":"hiddenHeader10153";
		arrow.src=`${extURL}icons/toogle.svg#d`;
		arrow.title=i18n("showInterface");
	}else{
		body.className="";
		arrow.src=`${extURL}icons/toogle.svg#t`;
		arrow.title=i18n("hideInterface");
	}
}
