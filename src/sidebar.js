"use strict";

const extURL=browser.extension.getURL("");
let prevContext;

(async function(){
	if(!document.getElementById("scanSites"))return;
	const result=browser.storage.local.get('settings');
	const {settings}=await result;
	if(settings.theme==="dark")document.documentElement.className="dark";
	if(settings.search){
		document.documentElement.dataset.search=true;
		document.getElementById("searchBar").classList.remove("none");
	}
	let openSiteBtn=document.getElementById("openSite");
	if(!settings.autoOpen){
		openSiteBtn.removeAttribute("class");
		openSiteBtn.addEventListener("click",()=>{
			browser.runtime.sendMessage({"openSites":true});
		});
	}
	listSite();
	translate();
	document.getElementById("scanSites").addEventListener("click",scanSites);
	document.getElementById("addSite").addEventListener("click",addSite);
	document.getElementById("showAdd").addEventListener("click",showAdd);
	document.getElementById("addFolder").addEventListener("click",showAddFolder);
	document.getElementById("addSaveF").addEventListener("click",e=>{
		addFolder(document.getElementById("nameFolderA").value);
		document.getElementById("addingFolder").classList.add("hidden");
		document.getElementById("addFolder").classList.remove("open");
	});
	document.getElementById("editCancel").addEventListener("click",hideAll);
	document.getElementById("addCancel").addEventListener("click",hideAll);
	document.getElementById("addCancelF").addEventListener("click",hideAll);
	document.getElementById("deleteCancel").addEventListener("click",hideAll);
	document.getElementById("editCancelF").addEventListener("click",hideAll);
	document.getElementById("deleteCancelF").addEventListener("click",hideAll);
	document.getElementById("options").addEventListener("click",()=>{browser.runtime.openOptionsPage();});
	window.addEventListener('contextmenu',e=>{if(!(e.target.tagName==="INPUT"&&(e.target.type==="text"||e.target.type==="number")))e.preventDefault();});
	document.addEventListener('selectstart',e=>{if(!(e.target.tagName==="INPUT"&&(e.target.type==="text"||e.target.type==="number"||e.target.type==="search")))e.preventDefault();});
	document.getElementById("lista").addEventListener('contextmenu',context);
	document.getElementById("fillForm").addEventListener("click",fillForm);
	document.getElementById("statusbar").addEventListener("mousemove",e=>{e.target.removeAttribute("class");});
	document.getElementById("editSite").addEventListener("click",e=>{editSite(e.target.dataset.id);});
	document.getElementById("deleteSite").addEventListener("click",e=>{deleteSite(parseInt(e.target.dataset.id));});
	document.getElementById("editSaveF").addEventListener("click",e=>{editFolder(e.target.dataset.id);});
	document.getElementById("deleteSaveF").addEventListener("click",e=>{deleteFolder(e.target.dataset.id);});
	document.getElementById("search").addEventListener("input",search);
	document.addEventListener("click",e=>{
		if(e.target.id!=="filter"&&e.target.parentElement.id!=="popupFilter"){
			document.getElementById("filter").classList.remove("open");
			document.getElementById("popupFilter").classList.add("hidden");
		}
	});
	document.addEventListener("blur",()=>{
		document.getElementById("filter").classList.remove("open");
		document.getElementById("popupFilter").classList.add("hidden");
	});
	document.getElementById("filter").addEventListener("click",()=>{
		document.getElementById("filter").classList.toggle("open");
		document.getElementById("popupFilter").classList.toggle("hidden");
	});
	let filterPopup=document.getElementById("popupFilter").children;
		filterPopup[1].addEventListener("click",e=>{e.target.classList.toggle("checked");search();});
		filterPopup[2].addEventListener("click",e=>{e.target.classList.toggle("checked");search();});
		filterPopup[3].addEventListener("click",e=>{e.target.classList.toggle("checked");search();});
		filterPopup[4].addEventListener("click",e=>{e.target.classList.toggle("checked");search();});
		filterPopup[5].addEventListener("click",e=>{e.target.classList.toggle("checked");search();});
	if(document.URL.slice(-1)==="?")document.body.classList.add("onPopup");
	document.getElementById("clear").addEventListener("click",e=>{
		document.getElementById("search").value="";
		search();
	});
	document.getElementById("eParitialMode").addEventListener("change",e=>{
		if(e.target.checked){
			document.getElementById("rowSelectorE").removeAttribute("class");
		}else{
			document.getElementById("rowSelectorE").className="hidden";
		}
	});
	document.getElementById("aParitialMode").addEventListener("change",e=>{
		if(e.target.checked){
			document.getElementById("rowSelectorA").removeAttribute("class");
		}else{
			document.getElementById("rowSelectorA").className="hidden";
		}
	});
	document.getElementById("inspectE").addEventListener("click",()=>{inspect("edit");});
	document.getElementById("inspectA").addEventListener("click",()=>{inspect("add");});
	document.getElementById("pageSettings").addEventListener("click",pageSettings);
})();

function context(e){
	const a=e.target.parentElement;
	if(a.tagName==="A")return;
	if(a.classList.contains("folder")){
		const id=parseInt(a.getAttribute("id").substr(6)),
			  c=document.getElementById(`editFolder${id}`);
		if(!c){
			hideAll();
			removeContext();
			let dInput=document.createElement('img');
				dInput.className="deleteFolder";
				dInput.id=`deleteFolder${id}`;
				dInput.src="icons/delete.svg";
				dInput.title=i18n("delete");
				dInput.draggable=false;
				dInput.addEventListener('click',()=>{
					showDeleteFolder(`folder${id}`,e.target.firstChild.textContent);
				});
			let eInput=document.createElement('img');
				eInput.className="editFolder";
				eInput.id=`editFolder${id}`;
				eInput.src="icons/edit.svg";
				eInput.title=i18n("edit");
				eInput.draggable=false;
				eInput.addEventListener('click',()=>{
					showEditFolder(`folder${id}`,e.target.firstChild.textContent);
				});
			let sInput=document.createElement('img');
				sInput.className="scanFolder";
				sInput.id=`scanFolder${id}`;
				sInput.src="icons/scan2.svg";
				sInput.title=i18n("scanWebpage");
				sInput.draggable=false;
				sInput.addEventListener('click',()=>{
					scanFolder(`folder${id}`);
				});
			e.target.append(dInput,eInput,sInput);
			prevContext=id;
		}
	}else if(a.tagName==="LI"){
		const id=parseInt(a.getAttribute("id").substr(4)),
			  c=document.getElementById(`edititem${id}`);
		if(!c){
			hideAll();
			removeContext();
			let eInput=document.createElement('input');
				eInput.className="editSite";
				eInput.id=`edititem${id}`;
				eInput.type="image";
				eInput.src="icons/edit.svg";
				eInput.title=i18n("edit");
				eInput.addEventListener('click',()=>{
					showEdit(id);
				});
			let dInput=document.createElement('input');
				dInput.className="deleteSite";
				dInput.id=`deleteitem${id}`;
				dInput.type="image";
				dInput.src="icons/delete.svg";
				dInput.title=i18n("delete");
				dInput.addEventListener('click',()=>{
					showDelete(id);
				});
			let sInput=document.createElement('input');
				sInput.className="scanPage";
				sInput.id=`scanitem${id}`;
				sInput.type="image";
				sInput.src="icons/scan2.svg";
				sInput.title=i18n("scanWebpage");
				sInput.addEventListener('click',()=>{
					browser.runtime.sendMessage({"scanPagesById":true,"idArray":[id]});
				});
			let pInput=document.createElement('input');
				pInput.id=`pauseitem${id}`;
				pInput.type="image";
				if(a.dataset.paused==="true"){
					pInput.className="playScan";
					pInput.src="icons/play.svg";
					pInput.title=i18n("playScan");
				}else{
					pInput.className="pauseScan";
					pInput.src="icons/pause.svg";
					pInput.title=i18n("pauseScan");
				}
				pInput.addEventListener('click',()=>{
					browser.storage.local.get('sites').then(result=>{
						let sites=result.sites,
							paused=(pInput.className==="pauseScan")?true:false;
						Object.assign(sites[id],{paused});
						browser.storage.local.set({sites}).then(()=>{
							if(paused){
								pInput.className="playScan";
								pInput.src="icons/play.svg";
								pInput.title=i18n("playScan");
							}else{
								pInput.className="pauseScan";
								pInput.src="icons/pause.svg";
								pInput.title=i18n("pauseScan");
							}
							a.dataset.paused=paused;
						});
					});
				});
			a.insertBefore(dInput,a.firstChild);
			a.insertBefore(eInput,dInput);
			a.insertBefore(sInput,eInput);
			a.insertBefore(pInput,dInput);
			prevContext=id;
		}
	}
}

function removeContext(){
	if(prevContext!==undefined){
		if(prevContext<10000){
			let aParent=document.getElementById(`item${prevContext}`),
				e1=document.getElementById(`edititem${prevContext}`),
				e2=document.getElementById(`deleteitem${prevContext}`),
				e3=document.getElementById(`scanitem${prevContext}`),
				e4=document.getElementById(`pauseitem${prevContext}`);
			aParent.removeChild(e1);
			aParent.removeChild(e2);
			aParent.removeChild(e3);
			aParent.removeChild(e4);
		}else{
			let aParent=document.getElementById(`folder${prevContext}`).firstElementChild,
				e1=document.getElementById(`editFolder${prevContext}`),
				e2=document.getElementById(`deleteFolder${prevContext}`),
				e3=document.getElementById(`scanFolder${prevContext}`);
			aParent.removeChild(e1);
			aParent.removeChild(e2);
			aParent.removeChild(e3);
		}
	}
}

function listSite(send){
	if(send)browser.runtime.sendMessage({"listSite":true});
	if(document.getElementById("search").value||document.getElementById("popupFilter").classList.contains("checked"))
		search();
	else{
	browser.storage.local.get(['sites','sort']).then(result=>{
		prevContext=undefined;
		document.getElementById("lista").textContent="";
		const sites=result.sites,
			  sort=result.sort,
			  list=document.getElementById("lista");
		let lastFolder;
		sort.forEach((value,i)=>{
			if(value[2]==="item"){
				let id=parseInt(value[0].substr(4));
				let iLi=document.createElement('li');
					iLi.id=value[0];
					iLi.dataset.row="a"+i;
					iLi.dataset.folder=value[1];
					iLi.draggable=true;
					if(sites[id].changed){
						iLi.classList.add("changed");
						if(value[1]!=="root")document.getElementById(value[1]).classList.add("changedFolder");
					}
					if(sites[id].broken>1)iLi.classList.add("gray");
					if(sites[id].paused)iLi.dataset.paused=true;
					iLi.addEventListener('dragstart',dragStart);
				let iA=document.createElement('a');
				iA.textContent=sites[id].title;
				iA.addEventListener('mouseup',e=>{openItem(e,id);});
				let iImg=document.createElement('img');
					iImg.className="favicon";
					iImg.src=sites[id].favicon;
					iImg.draggable=false;
				iA.insertBefore(iImg,iA.firstChild);
				iLi.appendChild(iA);
				if(value[1]==="root"){
					list.appendChild(iLi);
				}else
					lastFolder.appendChild(iLi);
			}else{
				let iUl=document.createElement('ul');
					iUl.id=value[0];
					iUl.dataset.row="a"+i;
					iUl.dataset.folder="root";
					iUl.draggable=true;
					iUl.addEventListener('dragstart',dragStart);
					iUl.className=value[4]?"folder collapsed":"folder";
				let iA=document.createElement('a');
					iA.textContent=value[3];
				iUl.addEventListener("click",e=>{
					if(!e.ctrlKey){
						e.target.parentElement.classList.toggle("collapsed");
						saveSort();
					}
				});
				iA.addEventListener("mousedown",e=>{
					updateHeight(iUl);
				});
				iA.addEventListener("mouseup",e=>{
					if(e.button===1||(e.button===0&&e.ctrlKey)){
						const folder=e.target.parentElement;					
						[...folder.childNodes].forEach(v=>{
							if(v.tagName==="LI"){
								const id=v.id.substr(4)*1;
								openItem(true,id);
							}
						});
					}
				});
				iUl.appendChild(iA);
				list.appendChild(iUl);
				lastFolder=iUl;
			}
		});
		document.body.classList.remove("none");
	});
	}
}

function openItem(e,id){
	if(e.button!=2){
		browser.tabs.create({
			url:`${extURL}view.html?${id}`,
			active:(e===true||e.button===1||(e.button===0&&e.ctrlKey===true))?false:true
		});
		const eLi=document.getElementById("item"+id);
		if(eLi.classList.contains("changed")){
			browser.runtime.sendMessage({"updateBadge":true,"updateBadgeArg":-1,"unchange":true,"unchangeArg":[id]});
			unchangeItem(id,e);
		}
	}
}

function search(){
	const s=document.getElementById("search").value,
		  cha=document.getElementById("popupFilter").children[1].classList.contains("checked"),
		  pau=document.getElementById("popupFilter").children[2].classList.contains("checked"),
		  bro=document.getElementById("popupFilter").children[3].classList.contains("checked"),
		  nor=document.getElementById("popupFilter").children[4].classList.contains("checked"),
		  par=document.getElementById("popupFilter").children[5].classList.contains("checked");
	if(cha||pau||bro||nor||par)
		document.getElementById("popupFilter").classList.add("checked");
	else
		document.getElementById("popupFilter").classList.remove("checked");
	if(s||cha||pau||bro||nor||par){
		browser.storage.local.get(['sites']).then(result=>{
			prevContext=undefined;
			document.getElementById("lista").textContent="";
			const sites=result.sites,
				  list=document.getElementById("lista");
			let filtred=sites.filter(v=>{
				return v.title.toUpperCase().includes(s.toUpperCase())||v.url.toUpperCase().includes(s.toUpperCase());
			});
			filtred=filtred.filter(v=>{
				return (cha&&v.changed===true)||(pau&&v.paused===true)||(bro&&v.broken>=2)||(par&&v.paritialMode===true)||(nor&&v.changed!=true&&v.paused!=true&&v.broken<2&&v.paritialMode!=true)||(!cha&&!pau&&!bro&&!nor&&!par);
			});
			filtred.forEach(value=>{
				let id=sites.indexOf(value),
					iLi=document.createElement('li');
					iLi.id="item"+id;
					if(value.changed)iLi.classList.add("changed");
					if(value.broken>1)iLi.classList.add("gray");
					if(value.paused)iLi.dataset.paused=true;
					iLi.addEventListener('dragstart',dragStart);
				let iA=document.createElement('a');
				iA.textContent=value.title;
				iA.addEventListener('mouseup',e=>{
					if(e.button!=2){
						if(e.target.parentNode.classList.contains("changed"))updateBadge(-1);
						browser.tabs.create({
							url:`${extURL}view.html?${id}`,
							active:(e.button===1||(e.button===0&&e.ctrlKey===true))?false:true
						});
						browser.runtime.sendMessage({"unchange":true,"unchangeArg":[id]});
						unchangeItem(id);
					}
				});
				let iImg=document.createElement('img');
					iImg.className="favicon";
					iImg.src=value.favicon;
				iA.insertBefore(iImg,iA.firstChild);
				iLi.appendChild(iA);
				list.appendChild(iLi);
			});
		});
	}else{
		listSite();
	}
}

function showAddFolder(){
	hideAll("addFolder");
	document.getElementById("nameFolderA").value="";
	document.getElementById("addingFolder").classList.toggle("hidden");
	document.getElementById("addFolder").classList.toggle("open");
}

function showEditFolder(id,name){
	hideAll("editFolder");
	document.getElementById("editSaveF").dataset.id=id;
	document.getElementById("nameFolder").value=name;
	document.getElementById("editingFolder").classList.remove("hidden");
}

function editFolder(id){
	let newName=document.getElementById("nameFolder").value;
	newName=newName?newName:i18n("newFolder");
	document.getElementById("editingFolder").classList.add("hidden");
	document.getElementById(id).firstElementChild.firstChild.textContent=newName;
	saveSort();
	statusbar(i18n("savedWebpage",newName));
}

function showDeleteFolder(id,name){
	hideAll("deleteFolder");
	document.getElementById("deleteSaveF").dataset.id=id;
	document.getElementById("deleteFolderName").textContent=name;
	document.getElementById("deletingFolder").classList.remove("hidden");
}

function deleteFolder(id){
	let name=document.getElementById("deleteFolderName").textContent;
	document.getElementById("deletingFolder").classList.add("hidden");
	browser.storage.local.get('sort').then(result=>{
		let sort=result.sort;
		sort.forEach((value,i)=>{
			if(value[0]===id)
				sort.splice(i,1);
		});	
		sort.forEach((value,i)=>{
			if(value[1]===id)
				sort[i][1]="root";
		});
		browser.storage.local.set({sort}).then(()=>{
			statusbar(i18n("deletedWebpage",name));
			listSite(true);
		});
	});
}

async function showEdit(e){
	hideAll("edit");
	let result=await browser.storage.local.get(['sites','settings']);
	const table=result.sites,
		  settings=result.settings;
	document.getElementById("editSite").dataset.id=e;
	document.getElementById("editingSite").classList.remove("hidden");
	document.getElementById("eUrl").value=table[e].url;
	document.getElementById("eTitle").value=table[e].title;
	document.getElementById("eCharset").value=table[e].charset?table[e].charset:settings.charset;
	const freq=table[e].freq;
	let multi;
	if(!(freq%168))
		multi=168;
	else if(!(freq%24))
		multi=24;
	else if(freq<1)
		multi=0.0166667;
	else
		multi=1;
	document.getElementById("eFreq").value=parseInt(freq/multi);
	document.getElementById("eMulti").value=multi;		
	document.getElementById("eMode").value=table[e].mode;
	document.getElementById("eIgnoreNumbers").checked=table[e].ignoreNumbers;
	document.getElementById("eIgnoreHrefs").checked=(table[e].ignoreHrefs===undefined)?settings.defaultIgnoreHrefs:table[e].ignoreHrefs;
	document.getElementById("eDeleteScripts").checked=(table[e].deleteScripts===undefined)?settings.defaultDeleteScripts:table[e].deleteScripts;
	document.getElementById("eDeleteComments").checked=(table[e].deleteComments===undefined)?settings.defaultDeleteComments:table[e].deleteComments;
	document.getElementById("rowSelectorE").className=table[e].paritialMode?"":"hidden";
	document.getElementById("eParitialMode").checked=table[e].paritialMode;
	document.getElementById("eCssSelector").value=(table[e].cssSelector===undefined)?"":table[e].cssSelector;
}

function editSite(e){
	document.getElementById("editingSite").classList.add("hidden");
	browser.storage.local.get(['sites','settings']).then(result=>{
		let sites=result.sites,
			freq=parseInt(document.getElementById("eFreq").value);
		let obj={
			title:	document.getElementById("eTitle").value,
			url:	document.getElementById("eUrl").value,
			mode:	document.getElementById("eMode").value,
			freq:	freq>0?freq*parseFloat(document.getElementById("eMulti").value):8,
			charset:document.getElementById("eCharset").value?document.getElementById("eCharset").value:result.settings.charset,
			paritialMode:document.getElementById("eParitialMode").checked,
			cssSelector:document.getElementById("eCssSelector").value,
			ignoreNumbers:document.getElementById("eIgnoreNumbers").checked,
			ignoreHrefs:document.getElementById("eIgnoreHrefs").checked,
			deleteScripts:document.getElementById("eDeleteScripts").checked,
			deleteComments:document.getElementById("eDeleteComments").checked,
		};
		Object.assign(sites[e],obj);
		browser.storage.local.set({sites}).then(()=>{
			statusbar(i18n("savedWebpage",sites[e].title));
			listSite(true);
		});
	});
}

function showDelete(e){
	hideAll("delete");
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		document.getElementById("deleteSite").dataset.id=e;
		document.getElementById("deleteTitle").textContent=sites[e].title;
		document.getElementById("deleteUrl").textContent=sites[e].url;
		document.getElementById("deletingSite").classList.remove("hidden");
	});
}

function deleteSite(e){
	document.getElementById("deletingSite").classList.add("hidden");
	browser.storage.local.get(['sites','changes','sort']).then(result=>{
		let sites=result.sites,
			changes=result.changes,
			sort=result.sort,
			sSort;
		statusbar(i18n("deletedWebpage",sites[e].title));
		sites.splice(e,1);
		changes.splice(e,1);
		if(sort){
			sort.forEach((value,i)=>{
				const id=parseInt(value[0].substr(4));
				if(id===e)sSort=i;
				else if(id>e)sort[i][0]=`item${id-1}`;
			});
			sort.splice(sSort,1);
		}
		browser.storage.local.set({sites:sites,changes:changes,sort:sort}).then(()=>{
			listSite(true);
			browser.runtime.sendMessage({"deletedSite":true,"id":e});
		});
	});
}

function showAdd(){
	browser.storage.local.get('settings').then(result=>{
		const settings=result.settings;
		const freq=settings.defaultFreq;
		let unit;
		if(!(freq%168))
			unit=168;
		else if(!(freq%24))
			unit=24;
		else if(freq<1)
			unit=0.0166667;
		else
			unit=1;
		hideAll("add");
		document.getElementById("addingSite").classList.toggle("hidden");
		document.getElementById("showAdd").classList.toggle("open");
		document.getElementById("aUrl").value="";
		document.getElementById("aTitle").value="";
		document.getElementById("aFreq").value=parseInt(freq/unit);;
		document.getElementById("aMulti").value=unit;
		document.getElementById("aMode").value=settings.defaultMode;
		document.getElementById("aParitialMode").checked=false;
		document.getElementById("aCssSelector").value="";
		document.getElementById("rowSelectorA").className="hidden";
		document.getElementById("aIgnoreNumbers").checked=settings.defaultIgnoreNumbers;
		document.getElementById("aIgnoreHrefs").checked=settings.defaultIgnoreHrefs;
		document.getElementById("aDeleteScripts").checked=settings.defaultDeleteScripts;
		document.getElementById("aDeleteComments").checked=settings.defaultDeleteComments;
	});
}

function addSite(){
	const url=document.getElementById("aUrl").value,
		  title=document.getElementById("aTitle").value,
		  mode=document.getElementById("aMode").value,
		  aFreq=parseInt(document.getElementById("aFreq").value),
		  freq=aFreq>0?aFreq*parseFloat(document.getElementById("aMulti").value):8,
		  cssSelector=(document.getElementById("aParitialMode").checked&&document.getElementById("aCssSelector").value.length)?document.getElementById("aCssSelector").value:false,
		  ignoreNumbers=document.getElementById("aIgnoreNumbers").checked,
		  ignoreHrefs=document.getElementById("aIgnoreHrefs").checked,
		  deleteScripts=document.getElementById("aDeleteScripts").checked,
		  deleteComments=document.getElementById("aDeleteComments").checked;
	browser.runtime.sendMessage({"addThis":true,"url":url,"title":title,"mode":mode,"freq":freq,"cssSelector":cssSelector,"ignoreNumbers":ignoreNumbers,"deleteScripts":deleteScripts,"deleteComments":deleteComments,"ignoreHrefs":ignoreHrefs});
	document.getElementById("addingSite").classList.add("hidden");
	document.getElementById("showAdd").classList.remove("open");
}

function fillForm(){
	browser.tabs.query({currentWindow:true,active:true}).then(tabs=>{
		let tab=tabs[0];
		document.getElementById("aUrl").value=tab.url;
		document.getElementById("aTitle").value=tab.title;
	});
}

function hideAll(e){
	if(e!="add"){
		document.getElementById("addingSite").classList.add("hidden");
		document.getElementById("aUrl").value="";
		document.getElementById("aTitle").value="";
		document.getElementById("aFreq").value=8;
		document.getElementById("aMulti").value=1;
		document.getElementById("aMode").value="m0";
		document.getElementById("showAdd").classList.remove("open");
	}
	if(e!="edit"){
		document.getElementById("editingSite").classList.add("hidden");
		document.getElementById("eUrl").value="";
		document.getElementById("eTitle").value="";
		document.getElementById("eCharset").value="";
		document.getElementById("eFreq").value=8;
		document.getElementById("eMulti").value=1;
		document.getElementById("eMode").value="m0";
	}
	if(e!="delete"){
		document.getElementById("deletingSite").classList.add("hidden");
		document.getElementById("deleteTitle").textContent="";
		document.getElementById("deleteUrl").textContent="";
	}
	if(e!="addFolder"){
		document.getElementById("addingFolder").classList.add("hidden");
		document.getElementById("nameFolderA").value="";
		document.getElementById("addFolder").classList.remove("open");
	}
	if(e!="editFolder"){
		document.getElementById("editingFolder").classList.add("hidden");
		document.getElementById("nameFolder").value="";
	}
	if(e!="deleteFolder"){
		document.getElementById("deletingFolder").classList.add("hidden");
		document.getElementById("deleteFolderName").textContent="";
	}
}

function statusbar(e){
	let statusbar=document.getElementById("statusbar");
	if(typeof(e)==="string"){
		statusbar.textContent=e;
		setTimeout(()=>{if(statusbar.textContent===e)statusbar.removeAttribute("class");},5000);
	}else{
		let progress;
		if(e[0]===1){
			statusbar.textContent="";
			progress=document.createElement('progress');
			progress.max=e[1];
			statusbar.appendChild(progress);
		}else{
			progress=document.getElementsByTagName("progress")[0];
		}
		progress.value=e[0];
	}
	statusbar.className="visible";
}


function updateHeight(elm,remove){
	if(remove)elm.style.height=null
	else elm.style.height=elm.scrollHeight+"px";
}

function unchangeItem(id,entireFolder){
	if(id===true){
		[...document.getElementsByClassName("changed")].forEach(v=>{
			v.classList.remove("changed");
		});
		unchangeFolder(true);
	}else{
		const item=document.getElementById("item"+id);
		item.classList.remove("changed");
		const parentFolder=item.parentElement;
		if(parentFolder.id!=="lista"&&parentFolder.classList.contains("changedFolder")){
			if(entireFolder===true) parentFolder.classList.remove("changedFolder");
			else unchangeFolder(parentFolder.id);
		}
	}
}

function unchangeFolder(id){
	if(id===true){
		[...document.getElementsByClassName("changedFolder")].forEach(v=>{
			v.classList.remove("changedFolder");
		});
	}else{
		const folder=document.getElementById(id);
		let changedInFolder=[...folder.childNodes].filter(v=>{
			return v.classList.contains("changed");
		});
		if(changedInFolder.length===0)folder.classList.remove("changedFolder");
	}
}

function scanFolder(id){
	hideAll();
	const folder=document.getElementById(id);
	let ids=[...folder.childNodes].map(v=>{
		if(v.tagName==="LI")
			return v.id.substr(4)*1;
	});
	ids.shift();
	browser.runtime.sendMessage({"scanPagesById":true,"idArray":ids});
}

function inspect(type){
	if(type==="edit"){
		let wpsURL=document.getElementById("eUrl").value,
			wpsID=document.getElementById("editSite").dataset.id;
		browser.tabs.create({url:wpsURL}).then(tab=>{
		  browser.tabs.executeScript({
			file:"/inspect.js",
			runAt:"document_end"
		  }).then(()=>{
			  browser.tabs.sendMessage(tab.id,{
				 "wpsURL":wpsURL,
				 "wpsID":wpsID,
				 "wpsType":"edit"
			  });
		  });
		  browser.tabs.insertCSS({
			file:"/inspect.css",
			runAt:"document_end"
		  });
		});
	}else if(type==="add"){
		let wpsURL=document.getElementById("aUrl").value;
		if(wpsURL.startsWith("http")){
			browser.tabs.create({url:wpsURL}).then(tab=>{
			  browser.tabs.executeScript({
				file:"/inspect.js",
				runAt:"document_end"
			  }).then(()=>{
				  browser.tabs.sendMessage(tab.id,{
					 "wpsURL":wpsURL,
					 "wpsType":"add"
				  });
			  });
			  browser.tabs.insertCSS({
				file:"/inspect.css",
				runAt:"document_end"
			  });
			});
		}
	}
}

async function fillSelector(m){
	if(m.type==="edit"){
		if(m.url===document.getElementById("eUrl").value){
			document.getElementById("eParitialMode").checked=true;
			document.getElementById("rowSelectorE").removeAttribute("class");
			document.getElementById("eCssSelector").value=m.selector;
		}else{
			await showEdit(m.id);
			if(m.url===document.getElementById("eUrl").value){
				document.getElementById("eParitialMode").checked=true;
				document.getElementById("rowSelectorE").removeAttribute("class");
				document.getElementById("eCssSelector").value=m.selector;
			}
		}
	}else if(m.type==="add"){
		if(m.url===document.getElementById("aUrl").value){
			document.getElementById("aParitialMode").checked=true;
			document.getElementById("rowSelectorA").removeAttribute("class");
			document.getElementById("aCssSelector").value=m.selector;
		}
	}
}

function pageSettings(){
	const id=document.getElementById("editSite").dataset.id;
	browser.tabs.create({url:`${extURL}view.html?${id}`}).then(tab=>{
		hideAll();
		browser.tabs.executeScript({
			code:"showEdit();"
		});
	});
}

function scanSites(){
	document.getElementById("scanSites").disabled=true;
	document.getElementById("openSite").disabled=true;
	document.getElementById("showAdd").disabled=true;
	document.getElementById("addFolder").disabled=true;
	hideAll();
	browser.runtime.sendMessage({"scanSites":true,"force":true});
}

browser.runtime.onMessage.addListener(run);
function run(m,s,r){
	if(m.listSite)listSite();
	if(m.changeTheme)document.documentElement.className=m.changeTheme;
	if(m.search!==undefined)document.documentElement.dataset.search=m.search;
	if(m.selector){
		fillSelector(m);
		r({sidebar:true});
	}
	if(m.unchangeItem)unchangeItem(m.unchangeItemId);
	if(m.statusbar)statusbar(m.statusbarArg);
	if(m.enableButtons){
		document.getElementById("scanSites").disabled=false;
		document.getElementById("openSite").disabled=false;
		document.getElementById("showAdd").disabled=false;
		document.getElementById("addFolder").disabled=false;
	}
	if(m.addClass){
		if(m.parentElement){
			document.getElementById(m.elementId).parentElement.classList.add(m.classList);
		}else{
			document.getElementById(m.elementId).classList.add(...m.classList);
		}
	}
}

function translate(){
	document.title=i18n("extensionName");
	document.getElementById("addCancel").textContent=i18n("cancel");
	document.getElementById("addSite").textContent=i18n("add");
	document.getElementById("addSaveF").textContent=i18n("add");
	document.getElementById("fillForm").textContent=i18n("fillForm");
	document.getElementById("editCancel").textContent=i18n("cancel");
	document.getElementById("editSite").textContent=i18n("save");
	document.getElementById("deleteCancel").textContent=i18n("cancel");
	document.getElementById("deleteSite").textContent=i18n("delete");
	document.getElementById("scanSites").title=i18n("scanWebpage");
	document.getElementById("openSite").title=i18n("openWebpage");
	document.getElementById("showAdd").title=i18n("addWebpage");
	document.getElementById("addFolder").title=i18n("addFolder");
	document.getElementById("options").title=i18n("options");
	document.getElementById("addWebpage").textContent=i18n("addWebpage");
	document.getElementById("addressA").textContent=i18n("address");
	document.getElementById("titleA").textContent=i18n("title");
	document.getElementById("scanFreqA").textContent=i18n("scanFreq");
	document.getElementById("addressE").textContent=i18n("address");
	document.getElementById("titleE").textContent=i18n("title");
	document.getElementById("scanFreqE").textContent=i18n("scanFreq");
	document.getElementById("charsetE").textContent=i18n("charset");
	document.getElementById("editWebpage").textContent=i18n("editWebpage");
	document.getElementById("modeTitleA").textContent=i18n("modeTitle");
	document.getElementById("modeTitleE").textContent=i18n("modeTitle");
	document.getElementById("deleteWebpage").textContent=i18n("deleteWebpage");
	document.getElementById("editFolder").textContent=i18n("editFolder");
	document.getElementById("nFolder").textContent=i18n("name");
	document.getElementById("nFolderA").textContent=i18n("name");
	document.getElementById("addCancelF").textContent=i18n("cancel");
	document.getElementById("editCancelF").textContent=i18n("cancel");
	document.getElementById("editSaveF").textContent=i18n("save");
	document.getElementById("deleteFolder").textContent=i18n("deleteFolder");
	document.getElementById("deleteFolderDesc").textContent=i18n("deleteFolderDesc");
	document.getElementById("deleteCancelF").textContent=i18n("cancel");
	document.getElementById("deleteSaveF").textContent=i18n("delete");
	document.getElementById("addFolderTitle").textContent=i18n("addFolder");
	document.getElementById("search").placeholder=i18n("search");
	document.getElementById("hidePages").textContent=i18n("hidePages");
	document.getElementById("paritialModeA").textContent=i18n("paritialMode");
	document.getElementById("paritialModeE").textContent=i18n("paritialMode");
	document.getElementById("cssSelectorA").textContent=i18n("selectorCSS");
	document.getElementById("cssSelectorE").textContent=i18n("selectorCSS");
	document.getElementById("inspectA").title=i18n("inspectElement");
	document.getElementById("inspectE").title=i18n("inspectElement");
	document.getElementById("ignoreNumbersA").textContent=i18n("ignoreNumbers");
	document.getElementById("ignoreNumbersE").textContent=i18n("ignoreNumbers");
	document.getElementById("ignoreHrefsA").textContent=i18n("ignoreHrefs");
	document.getElementById("ignoreHrefsE").textContent=i18n("ignoreHrefs");
	document.getElementById("deleteScriptsA").textContent=i18n("deleteScripts");
	document.getElementById("deleteScriptsE").textContent=i18n("deleteScripts");
	document.getElementById("deleteCommentsA").textContent=i18n("deleteComments");
	document.getElementById("deleteCommentsE").textContent=i18n("deleteComments");
	document.getElementById("pageSettings").textContent=i18n("options");
	
	let selectMultiA=document.getElementById("aMulti").options;
		selectMultiA[0].text=i18n("minutes");
		selectMultiA[1].text=i18n("hours");
		selectMultiA[2].text=i18n("days");
		selectMultiA[3].text=i18n("weeks");
	let selectModeA=document.getElementById("aMode").options;
		selectModeA[0].text=i18n("modeM0");
		selectModeA[1].text=i18n("modeM3");
		selectModeA[2].text=i18n("modeM4");
		selectModeA[3].text=i18n("modeM1");
		selectModeA[4].text=i18n("modeM2");
	let selectMultiE=document.getElementById("eMulti").options;
		selectMultiE[0].text=i18n("minutes");
		selectMultiE[1].text=i18n("hours");
		selectMultiE[2].text=i18n("days");
		selectMultiE[3].text=i18n("weeks");
	let selectModeE=document.getElementById("eMode").options;
		selectModeE[0].text=i18n("modeM0");
		selectModeE[1].text=i18n("modeM3");
		selectModeE[2].text=i18n("modeM4");
		selectModeE[3].text=i18n("modeM1");
		selectModeE[4].text=i18n("modeM2");
	let popupFilter=document.getElementById("popupFilter").children;
		popupFilter[1].textContent=i18n("changed");
		popupFilter[2].textContent=i18n("paused");
		popupFilter[3].textContent=i18n("broken");
		popupFilter[4].textContent=i18n("normal");
		popupFilter[5].textContent=i18n("paritially");
}

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}
