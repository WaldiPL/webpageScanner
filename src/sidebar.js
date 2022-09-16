"use strict";

const extURL=browser.runtime.getURL("");
let prevContext;

(async function(){
	if(!document.getElementById("scanSites"))return;
	const result=browser.storage.local.get(['settings','dbVersion']);
	const {settings,dbVersion}=await result;
	document.documentElement.className=settings.theme?settings.theme:"auto";
	if(settings.search){
		document.documentElement.dataset.search=true;
		document.getElementById("searchBar").classList.remove("none");
	}
	let openSiteBtn=document.getElementById("openSite");
	if(!settings.autoOpen){
		openSiteBtn.removeAttribute("class");
		openSiteBtn.addEventListener("click",()=>{
			browser.runtime.sendMessage({"openSites":true}).then(()=>{},err=>{console.warn(err);});
		});
	}
	if(dbVersion===1)listSite();
	translate();
	document.getElementById("scanSites").addEventListener("click",scanSites);
	document.getElementById("showAdd").addEventListener("click",showAdd);
	document.getElementById("addFolder").addEventListener("click",showAddFolder);
	document.getElementById("addSaveF").addEventListener("click",e=>{
		addFolder(document.getElementById("nameFolderA").value);
		document.getElementById("addingFolder").classList.add("hidden");
		document.getElementById("addFolder").classList.remove("open");
	});
	document.getElementById("addCancelF").addEventListener("click",hideAll);
	document.getElementById("deleteCancel").addEventListener("click",hideAll);
	document.getElementById("editCancelF").addEventListener("click",hideAll);
	document.getElementById("deleteCancelF").addEventListener("click",hideAll);
	document.getElementById("options").addEventListener("click",()=>{browser.runtime.openOptionsPage();});
	window.addEventListener('contextmenu',e=>{if(!(e.target.tagName==="INPUT"&&(e.target.type==="text"||e.target.type==="number")))e.preventDefault();});
	document.addEventListener('selectstart',e=>{if(!(e.target.tagName==="INPUT"&&(e.target.type==="text"||e.target.type==="number"||e.target.type==="search")))e.preventDefault();});
	document.getElementById("lista").addEventListener('contextmenu',context);
	document.getElementById("statusbar").addEventListener("mousemove",e=>{e.target.removeAttribute("class");});
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
				sInput.src="icons/scan.svg";
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
				sInput.src="icons/scan.svg";
				sInput.title=i18n("scanWebpage");
				sInput.addEventListener('click',()=>{
					browser.runtime.sendMessage({
						"scanPagesById":true,
						"idArray":[id]
						}).then(()=>{},err=>{
							console.warn(err);
						});
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
						},err=>{
							console.error(err);
						});
					},err=>{
						console.error(err);
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

let onClickId;

function listSite(send){
	if(send){
		browser.runtime.sendMessage({"listSite":true}).then(()=>{},err=>{console.warn(err);});
	}
	if(document.getElementById("search").value||document.getElementById("popupFilter").classList.contains("checked")){
		search();
	}else{
	browser.storage.local.get(['sites','sort']).then(result=>{
		prevContext=undefined;
		document.getElementById("lista").textContent="";
		const sites=result.sites,
			  sort=result.sort,
			  list=document.getElementById("lista");
		let lastFolder,sitesOnList=0;
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
				iA.addEventListener('mousedown',e=>{
					if(e.button!=2){
						onClickId=id;
					}
				});
				iA.addEventListener('mouseup',e=>{
					if(e.button!=2&&onClickId===id){
						openItem(e,id);
					}
					onClickId=undefined;
				});
				let iImg=document.createElement('img');
					iImg.className="favicon";
					iImg.src=sites[id].favicon;
					iImg.draggable=false;
				iA.insertBefore(iImg,iA.firstChild);
				iLi.appendChild(iA);
				if(value[1]==="root"){
					list.appendChild(iLi);
				}else{
					lastFolder.appendChild(iLi);
				}
				sitesOnList++;
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
					if(e.button===1||(e.button===0&&e.ctrlKey)){
						onClickId=value[0];
					}
				});
				iA.addEventListener("mouseup",e=>{
					if((e.button===1||(e.button===0&&e.ctrlKey))&&onClickId===value[0]){
						const folder=e.target.parentElement;					
						[...folder.childNodes].forEach(v=>{
							if(v.tagName==="LI"){
								const id=v.id.substr(4)*1;
								openItem(true,id);
							}
						});
					}
					onClickId=undefined;
				});
				iUl.appendChild(iA);
				list.appendChild(iUl);
				lastFolder=iUl;
			}
		});
		if(sites.length>sitesOnList)repairSort(sites.length);
		document.body.classList.remove("none");
		if(!bookmarksToAdd.length)dropOverlay.classList.add("none");
	},err=>{
		console.error(err);
	});
	}
}

function repairSort(sitesLength){
	browser.storage.local.get("sort").then(result=>{
		let {sort}=result;
		let currentSort=sort.filter(e=>{
			return e[2]==="item";
		}).map(e=>{
			return parseInt(e[0].substr(4));
		});
		for(let i=0;i<sitesLength;i++){
			if(!currentSort.includes(i)){
				sort.push(["item"+i,"root","item","",false]);
			}
		}
		browser.storage.local.set({sort}).then(()=>{
			listSite(true);
		},err=>{
			console.error(err);
		});
	},err=>{
		console.error(err);
	});
}

function openItem(e,id){
	browser.tabs.create({
		url:`${extURL}view.html?${id}`,
		active:(e===true||e.button===1||(e.button===0&&e.ctrlKey===true))?false:true
	});
	const eLi=document.getElementById("item"+id);
	if(eLi.classList.contains("changed")){
		browser.runtime.sendMessage({
			"updateBadge":true,
			"updateBadgeArg":-1,
			"unchange":true,
			"unchangeArg":[id]
		}).then(()=>{},err=>{
			console.warn(err);
		});
		unchangeItem(id,e);
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
						if(e.target.parentNode.classList.contains("changed")){
							browser.runtime.sendMessage({"updateBadge":true,"updateBadgeArg":-1});
						}
						browser.tabs.create({
							url:`${extURL}view.html?${id}`,
							active:(e.button===1||(e.button===0&&e.ctrlKey===true))?false:true
						});
						browser.runtime.sendMessage({
							"unchange":true,
							"unchangeArg":[id]}
						).then(()=>{},err=>{
							console.warn(err);
						});
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
		},err=>{
			console.error(err);
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
		},err=>{
			console.error(err);
		});
	},err=>{
		console.error(err);
	});
}

function showEdit(id){
	browser.tabs.create({url:`${extURL}dialog.html?onEmptyTab&edit&editId=${id}`});
}

function showDelete(e){
	hideAll("delete");
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		document.getElementById("deleteSite").dataset.id=e;
		document.getElementById("deleteTitle").textContent=sites[e].title;
		document.getElementById("deleteUrl").textContent=sites[e].url;
		document.getElementById("deletingSite").classList.remove("hidden");
	},err=>{
		console.error(err);
	});
}

function deleteSite(e){
	document.getElementById("deletingSite").classList.add("hidden");
	browser.storage.local.get(['sites','sort']).then(result=>{
		let sites=result.sites,
			sort=result.sort,
			sSort,
			uniqId=sites[e].uniq;
		statusbar(i18n("deletedWebpage",sites[e].title));
		sites.splice(e,1);
		if(sort){
			sort.forEach((value,i)=>{
				const id=parseInt(value[0].substr(4));
				if(id===e)sSort=i;
				else if(id>e)sort[i][0]=`item${id-1}`;
			});
			sort.splice(sSort,1);
		}
		browser.storage.local.set({sites,sort}).then(()=>{
			listSite(true);
			browser.runtime.sendMessage({
				"deletedSite":true,
				"id":e
			}).then(()=>{},err=>{
				console.warn(err);
			});
			deleteChanges(uniqId);
		},err=>{
			console.error(err);
		});
	},err=>{
		console.error(err);
	});
}

function showAdd(){
	browser.tabs.query({currentWindow:true,active:true}).then(tabs=>{
		const tab=tabs[0];
		if(tab.url.startsWith("http")){
			browser.tabs.create({url:`${extURL}dialog.html?onEmptyTab&add&tabId=${tab.id}`});
		}else{
			browser.tabs.create({url:`${extURL}dialog.html?onEmptyTab&add`});
		}	
	});
}

function hideAll(e){
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
	browser.runtime.sendMessage({
		"scanPagesById":true,
		"idArray":ids
		}).then(()=>{},err=>{
			console.warn(err);
		});
}

function scanSites(){
	document.getElementById("scanSites").disabled=true;
	document.getElementById("openSite").disabled=true;
	document.getElementById("showAdd").disabled=true;
	document.getElementById("addFolder").disabled=true;
	hideAll();
	browser.runtime.sendMessage({
		"scanSites":true,
		"force":true
	}).then(()=>{},err=>{
		console.warn(err);
	});
}

browser.runtime.onMessage.addListener(run);
function run(m,s,r){
	if(m.listSite)listSite();
	if(m.changeTheme)document.documentElement.className=m.changeTheme;
	if(m.search!==undefined)document.documentElement.dataset.search=m.search;
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
	document.getElementById("addSaveF").textContent=i18n("add");
	document.getElementById("deleteCancel").textContent=i18n("cancel");
	document.getElementById("deleteSite").textContent=i18n("delete");
	document.getElementById("scanSites").title=i18n("scanWebpage");
	document.getElementById("openSite").title=i18n("openWebpage");
	document.getElementById("showAdd").title=i18n("addWebpage");
	document.getElementById("addFolder").title=i18n("addFolder");
	document.getElementById("options").title=i18n("options");
	document.getElementById("deleteWebpage").textContent=i18n("deleteWebpage");
	document.getElementById("editFolder").textContent=i18n("editFolder");
	document.getElementById("nameFolder").placeholder=i18n("name");
	document.getElementById("nameFolderA").placeholder=i18n("name");
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
