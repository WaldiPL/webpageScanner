var localId,
	highlighted,
	prevHighlighted,
	filteredChanges;
const extURL=browser.extension.getURL("");

(function(){
	const urlString=window.location.search;
	localId=parseInt(urlString.substr(1));
	translate();
	document.getElementById("oldHtml10153").addEventListener("click",()=>{load(localId,"oldHtml");});
	document.getElementById("newHtml10153").addEventListener("click",()=>{load(localId,"newHtml");});
	document.getElementById("news10153").addEventListener("click",()=>{load(localId,"news");});
	document.getElementById("deleted10153").addEventListener("click",()=>{load(localId,"deleted");});
	document.getElementById("light10153").addEventListener("click",()=>{load(localId,"light");});
	document.getElementById("active10153").addEventListener("click",()=>{load(localId,"active");});
	document.getElementById("delete10153").addEventListener("click",()=>{showDelete(localId);});
	document.getElementById("deleteCancel10153").addEventListener("click",e=>{e.target.offsetParent.classList.add("hidden");});
	document.getElementById("edit10153").addEventListener("click",()=>{showEdit(localId);});
	document.getElementById("editCancel10153").addEventListener("click",e=>{e.target.offsetParent.classList.add("hidden");});
	let js=document.createElement("script");
	getSettings().then(s=>{
		if(s.diffOld)js.src="diffOld.js";
		else js.src="diff.js";
		document.body.appendChild(js);
		js.onload=function(){
			load(localId,s.defaultView);
		}
		if(s.hideHeader)toogleHeader(true);
	});
	document.getElementById("toogleHeader10153").addEventListener("click",()=>{toogleHeader();});
	document.getElementById("prev10153").addEventListener("click",()=>{nextPrev(false);});
	document.getElementById("next10153").addEventListener("click",()=>{nextPrev(true);});
	document.getElementById("close10153").addEventListener("click",toggleNextPrev);
})();

function nextPrev(next){
	if(!filteredChanges.length||(filteredChanges.length===1&&highlighted===0))return;
	if(next){
		if(highlighted<filteredChanges.length-1){
			prevHighlighted=highlighted;
			highlighted++;
		}else{
			prevHighlighted=highlighted!==undefined?filteredChanges.length-1:undefined;
			highlighted=0;
		}
	}else{
		if(highlighted>0){
			prevHighlighted=prevHighlighted!==undefined?highlighted:0;
			highlighted=highlighted!==undefined?highlighted-1:0;
		}else{
			prevHighlighted=0;
			highlighted=filteredChanges.length-1;
		}
	}
	document.getElementById("xtext10153").textContent=i18n("changeOf",[highlighted+1,filteredChanges.length]);
	filteredChanges[highlighted].classList.add("hlc");
	if(prevHighlighted!==undefined)filteredChanges[prevHighlighted].classList.remove("hlc");
	browser.runtime.getBrowserInfo().then(e=>{
		let version=+e.version.substr(0,2);
		if(version<57)
			filteredChanges[highlighted].scrollIntoView({behavior:"smooth",block:"end"});
		else
			filteredChanges[highlighted].scrollIntoView({behavior:"smooth",block:"center"});
	});
}

function toggleNextPrev(show){
	if(show===true){
		getSettings().then(s=>{
			if(s.showNextPrev){
				document.getElementById("highlight10153").removeAttribute("class");
				if(s.scrollToFirstChange)setTimeout(()=>{nextPrev(true);},500);
			}
		});
	}else{
		document.getElementById("highlight10153").className="hidden";
		if(show)filteredChanges[highlighted].classList.remove("hlc");
	}
}

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
	browser.storage.local.get(['sites','changes','sort']).then(result=>{
		let sites=result.sites,
			changes=result.changes,
			sort=result.sort,
			sSort;
		sites.splice(e,1);
		changes.splice(e,1);
		if(sort){
			sort.forEach((value,i)=>{
				id=parseInt(value[0].substr(4));
				if(id===e)sSort=i;
				else if(id>e)sort[i][0]=`item${id-1}`;
			});
			sort.splice(sSort,1);
		}
		browser.storage.local.set({sites:sites,changes:changes,sort:sort}).then(()=>{
			browser.runtime.sendMessage({"listSite":true,"deletedSite":true,"id":e});
			browser.tabs.getCurrent().then(tab=>{browser.tabs.remove(tab.id);});
		});
	});
}

function showEdit(e){
	document.getElementById("deletingSite10153").classList.add("hidden");
	browser.storage.local.get(['sites','settings']).then(result=>{
		const sites=result.sites;
		document.getElementById("editSite10153").addEventListener("click",()=>{editSite(e);});
		document.getElementById("editingSite10153").classList.remove("hidden");
		document.getElementById("eUrl10153").value=sites[e].url;
		document.getElementById("eTitle10153").value=sites[e].title;
		document.getElementById("eCharset10153").value=sites[e].charset?sites[e].charset:result.settings.charset;
		const freq=sites[e].freq;
		let multi;
		if(freq>=168)
			multi=168;
		else if(freq>=24)
			multi=24;
		else
			multi=1;
		document.getElementById("eFreq10153").value=parseInt(freq/multi);
		document.getElementById("eMulti10153").value=multi;
		document.getElementById("eMode10153").value=sites[e].mode;
	});
}

function editSite(e){
	document.getElementById("editingSite10153").classList.add("hidden");
	browser.storage.local.get(['sites','settings']).then(result=>{
		let sites=result.sites,
			freq=parseInt(document.getElementById("eFreq10153").value);
		let obj={
			title:	document.getElementById("eTitle10153").value,
			url:	document.getElementById("eUrl10153").value,
			mode:	document.getElementById("eMode10153").value,
			favicon:"https://icons.better-idea.org/icon?size=16..16..16&url="+document.getElementById("eUrl10153").value,
			freq:	freq>0?freq*parseInt(document.getElementById("eMulti10153").value):8,
			charset:document.getElementById("eCharset10153").value?document.getElementById("eCharset10153").value:result.settings.charset
		}
		document.getElementById("title10153").textContent=obj.title;
		sites[e]=Object.assign(sites[e],obj);
		browser.storage.local.set({sites}).then(()=>{
			browser.runtime.sendMessage({"listSite":true});
		});
	});
}

function setTitle(){
	const metaTitles=document.getElementsByTagName("title"),
		  metaTitle=metaTitles[metaTitles.length-1],
		  userTitle=document.getElementById("title10153").textContent,
		  docTitle=document.title;
	if(docTitle.includes("<span class='changes10153'>"))document.title=document.title.slice(27, -7);
	else if(docTitle=="")document.title=userTitle;
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
			  deleted=cId?diffString.o:"",
			  url=sId.url.split("/"),
			  url2=url[0]+"//"+url[2]+"/";
		if(type==="active"){
			window.location=sId.url;
			return;
		}
		let parser=new DOMParser(),
			doc;
		if(oldHtml)enableBtn("oldHtml10153");
		if(news)enableBtn("news10153");
		if(deleted)enableBtn("deleted10153");
		document.getElementById("title10153").textContent=sId.title;
		document.getElementById("lastScan10153").textContent=i18n("lastScan",[realDate(sId.date),realTime(sId.time)]);
		toggleNextPrev();
		highlighted=undefined;
		prevHighlighted=undefined;
		switch(type){
			case "light":
				doc=parser.parseFromString(light,"text/html");
				toggleNextPrev(true);
				break;
			case "news":
				doc=parser.parseFromString(news,"text/html");
				break;
			case "deleted":
				doc=parser.parseFromString(deleted,"text/html");
				break;
			case "newHtml":
				doc=parser.parseFromString(newHtml,"text/html");
				break;
			case "oldHtml":
				doc=parser.parseFromString(oldHtml,"text/html");
				break;
		}
		document.getElementById("content10153").textContent="";
		document.getElementById("content10153").appendChild(doc.children[0]);
		const allChanges=document.getElementsByClassName("changes10153");
		getSettings("skipMinorChanges").then(s=>{
			if(s){
				filteredChanges=[...allChanges].filter((element,index,array)=>{
					return (element.childNodes[0].length>1||element.children.length);
				});
			}else
				filteredChanges=allChanges;
			document.getElementById("xtext10153").textContent=i18n("numberOfChanges",filteredChanges.length);
		});
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
	document.getElementById("deleted10153").classList.remove("active10153");
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
	document.getElementById("deleted10153").textContent=i18n("deletedElements");
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
	let selectFreq=document.getElementById("eMulti10153").options;
		selectFreq[0].text=i18n("hours");
		selectFreq[1].text=i18n("days");
		selectFreq[2].text=i18n("weeks");
	let selectMode=document.getElementById("eMode10153").options;
		selectMode[0].text=i18n("modeM0");
		selectMode[1].text=i18n("modeM3");
		selectMode[2].text=i18n("modeM4");
		selectMode[3].text=i18n("modeM1");
		selectMode[4].text=i18n("modeM2");
	document.getElementById("toogleHeader10153").title=i18n("hideInterface");
	document.getElementById("prev10153").title=i18n("scrollPrev");
	document.getElementById("next10153").title=i18n("scrollNext");
	document.getElementById("close10153").title=i18n("close");
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

function enableBtn(name){
	document.getElementById(name).disabled=false;
}
