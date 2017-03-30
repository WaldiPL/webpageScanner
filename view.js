 var localId;
 
(function(){
	const urlString = window.location.search;
	localId = parseInt(urlString.substr(1));
	document.getElementById("oldHtml10153").addEventListener("click",()=>{load(localId,"oldHtml");});
	document.getElementById("newHtml10153").addEventListener("click",()=>{load(localId,"newHtml");});
	document.getElementById("news10153").addEventListener("click",()=>{load(localId,"news");});
	document.getElementById("light10153").addEventListener("click",()=>{load(localId,"light");});
	document.getElementById("active10153").addEventListener("click",()=>{load(localId,"active");});
	document.getElementById("delete10153").addEventListener("click",()=>{showDelete(localId);});
	document.getElementById("deleteCancel10153").addEventListener("click",(e)=>{e.target.offsetParent.classList.add("hidden");});
	document.getElementById("edit10153").addEventListener("click",()=>{showEdit(localId);});
	document.getElementById("editCancel10153").addEventListener("click",(e)=>{e.target.offsetParent.classList.add("hidden");});
	load(localId,"light");
})();

function showDelete(e){
	document.getElementById("editingSite10153").classList.add("hidden");
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		document.getElementById("deleteSite10153").addEventListener("click",()=>{deleteSite(e);});
		document.getElementById("deletingSite10153").classList.remove("hidden");
		document.getElementById("deleteTitle10153").innerHTML=sites[e].title;
	});
}

function deleteSite(e){
	browser.storage.local.get().then(result=>{
		let sites=result.sites;
		let changes=result.changes;
		sites.splice(e,1);
		changes.splice(e,1);
		browser.storage.local.set({sites:sites,changes:changes});
	}).then(()=>{
		browser.runtime.sendMessage({"listSite": true,"deletedSite":true,"id":e});
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
			title:  document.getElementById("eTitle10153").value,
			url:    document.getElementById("eUrl10153").value,
			mode:   document.getElementById("eMode10153").value,
			favicon:"https://icons.better-idea.org/icon?size=16..16..16&url="+document.getElementById("eUrl10153").value,
			freq:   parseInt(document.getElementById("eFreq10153").value),
			charset:document.getElementById("eCharset10153").value?document.getElementById("eCharset10153").value:"utf-8"
		}
		document.getElementById("title10153").innerHTML=obj.title;
		sites[e] = Object.assign(sites[e],obj);
		browser.storage.local.set({sites});
	}).then(()=>{
		  browser.runtime.sendMessage({"listSite": true});
	});
}

function load(siteId,type){
	btnActive(type);
	browser.storage.local.get().then(result=>{
		const sites = result.sites;
		const changes = result.changes;
		const sId = sites[siteId];
		const cId = changes[siteId];
		const newHtml = cId.html;
		const oldHtml = cId?cId.oldHtml:"";
		const light = cId?diffString2(oldHtml,newHtml).n:newHtml;
		const news = cId?diffString2(oldHtml,newHtml).c:"";
		const url = sId.url.split("/");
		const url2 = url[0]+"//"+url[2];
		document.getElementById("title10153").innerHTML=sId.title;
		document.getElementById("lastScan10153").innerHTML=i18n("lastScan",[realDate(sId.date),realTime(sId.time)]);
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
		const a=document.getElementsByTagName("a");
		const img=document.getElementsByTagName("img");
		const css=document.getElementsByTagName("link");
		setTimeout(function(){
			[...a].forEach(value=>{
				if(value.href.substring(0,16)=="moz-extension://")value.href=value.href.replace(this.location.origin,url2);
			});
			[...img].forEach(value=>{
				if(value.id != "icon10153" && value.src.substring(0,16)=="moz-extension://")value.src=value.src.replace(this.location.origin,url2);
			});
			[...css].forEach(value=>{
				if(value.id != "diff10153" && value.href.substring(0,16)=="moz-extension://")value.href=value.href.replace(this.location.origin,url2);
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
	const m=parseInt(e);
	const month=i18n("monthList").split(",");
	const d=parseInt((e-m)*100);
	return `${d} ${month[m]}`;
}

function realTime(e){
	e+="";
	let h=e.split(".")[0];
	let m=e.split(".")[1];
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