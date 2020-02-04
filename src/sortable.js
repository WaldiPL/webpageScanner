"use strict";

const list=document.getElementById("lista"),
	  nav=document.getElementById("navPanel"),
	  searchBar=document.getElementById("searchBar"),
	  dragIndicator=document.getElementById("dragIndicator");

let startY,
	enter,
	dragged,
	folderId,
	frag,
	hlFolder;

(function(){
	list.addEventListener('drop',drop);
	list.addEventListener('dragover',dragOver);
	list.addEventListener('dragenter',dragEnter);
	list.addEventListener('dragend',dragEnd);
	list.addEventListener('dragexit',dragExit);
	nav.addEventListener('drop',drop);
	nav.addEventListener('dragover',dragOver);
	nav.addEventListener('dragenter',dragEnter);
	nav.addEventListener('dragend',dragEnd);
	searchBar.addEventListener('drop',drop);
	searchBar.addEventListener('dragover',dragOver);
	searchBar.addEventListener('dragenter',dragEnter);
	searchBar.addEventListener('dragend',dragEnd);
})();

function dragStart(e){
	startY=e.clientY;
	e.dataTransfer.setData('text',[]);
	dragIndicator.style.top=0;
	dragIndicator.removeAttribute("class");
	dragged=e.target;
}

function dragOver(e){
	if(e.preventDefault)e.preventDefault();
}

function dragExit(e){
	if(enter.firstElementChild.tagName==="A"&&(enter.firstElementChild.className==="indicator"||enter.parentElement.firstElementChild.className==="indicator"))
		hlFolder.removeAttribute("class");
}

function dragEnter(e){
	const toTop=e.clientY<startY;
	const scrollTop=list.scrollTop;
	enter=e.target.tagName==="A"?e.target.parentElement:e.target.parentElement.parentElement;
	dragIndicator.style.left=0;
	folderId="root";
	if(dragged===enter||dragged===enter.parentElement||!dragged){
		dragIndicator.style.top=0;
		return;
	}else if(enter.tagName==="HTML"||enter.tagName==="BODY"){
		if(e.target.id==="lista"){
			if(e.target.lastElementChild.className==="folder")
				dragIndicator.style.top=e.target.lastElementChild.lastElementChild.offsetTop+31+"px";
			else
				dragIndicator.style.top=e.target.lastElementChild.offsetTop+31+"px";
		}else{
			dragIndicator.style.top=list.offsetTop+"px";	
		}
	}else if(enter.classList.contains("collapsed")&&dragged.classList.contains("folder")){
		if(toTop)dragIndicator.style.top=enter.offsetTop-scrollTop+"px";
		else dragIndicator.style.top=enter.offsetTop+31-scrollTop+"px";
	}else if(dragged.classList.contains("folder")&&enter.classList.contains("folder")){
		if(toTop)dragIndicator.style.top=enter.offsetTop-scrollTop+"px";
		else dragIndicator.style.top=(enter.lastElementChild.offsetTop+31-scrollTop+"px")||"20px";
	}else if(dragged.classList.contains("folder")&&enter.dataset.folder!=="root"){
		if(toTop)dragIndicator.style.top=enter.parentElement.offsetTop-scrollTop+"px";
		else dragIndicator.style.top=enter.parentElement.lastElementChild.offsetTop+31-scrollTop+"px";
	}else if(enter.dataset.folder!=="root"&&dragged.className!=="folder"){
		folderId=enter.dataset.folder;
		if(toTop)dragIndicator.style.top=enter.offsetTop-scrollTop+"px";
		else dragIndicator.style.top=enter.offsetTop+31-scrollTop+"px";
		dragIndicator.style.left="20px";
		hlFolder=enter.parentElement.firstElementChild;
		hlFolder.className="indicator";
	}else if(enter.classList.contains("folder")){
		folderId=enter.id;
		if(enter.className==="folder"){
			dragIndicator.style.top=enter.lastElementChild.offsetTop+31-scrollTop+"px";
		}else{
			dragIndicator.style.top=enter.offsetTop+31-scrollTop+"px";
		}
		dragIndicator.style.left="20px";
		hlFolder=enter.firstElementChild;
		hlFolder.className="indicator";
	}else{
		if(toTop)dragIndicator.style.top=enter.offsetTop-scrollTop+"px";
		else dragIndicator.style.top=enter.offsetTop+31-scrollTop+"px";
	}
}

function drop(e){
	if(e.preventDefault)e.preventDefault();
	if(dragged===enter||dragged===enter.parentElement||!dragged)return;
	const toTop=e.clientY<startY,
		  toBottom=e.clientY>startY;
	frag=document.createDocumentFragment();
	frag.appendChild(dragged);
	if(enter.tagName==="HTML"||enter.tagName==="BODY"){
		if(toTop)list.insertBefore(frag,list.firstElementChild);
		else list.appendChild(frag);
	}else if(dragged.classList.contains("folder")&&enter.dataset.folder!=="root"){
		if(toTop)list.insertBefore(frag,enter.parentElement);
		else if(enter.parentElement.nextElementSibling)list.insertBefore(frag,enter.parentElement.nextElementSibling);
		else list.appendChild(frag);
	}else if(enter.classList.contains("folder")&&dragged.classList.contains("folder")){
		if(toTop)list.insertBefore(frag,enter);
		else if(enter.nextElementSibling)list.insertBefore(frag,enter.nextElementSibling);
		else list.appendChild(frag);
	}else if(enter.classList.contains("folder")){
		enter.appendChild(frag);
		updateHeight(enter,true);
		if(dragged.classList.contains("changed"))document.getElementById(enter.id).classList.add("changedFolder");
	}else if(folderId!=="root"){
		if(toTop)document.getElementById(folderId).insertBefore(frag,enter);
		else if(enter.nextElementSibling)document.getElementById(folderId).insertBefore(frag,enter.nextElementSibling);
		else document.getElementById(folderId).appendChild(frag);
		updateHeight(document.getElementById(folderId),true);
		if(dragged.classList.contains("changed"))document.getElementById(folderId).classList.add("changedFolder");
	}else if(toTop)list.insertBefore(frag,enter);
	else if(enter.nextElementSibling&&toBottom)list.insertBefore(frag,enter.nextElementSibling);
	else if(!enter.nextElementSibling&&toBottom)list.appendChild(frag);
	if(dragged.dataset.folder!=="root"){
		updateHeight(document.getElementById(dragged.dataset.folder),true);
		unchangeFolder(dragged.dataset.folder);
	}
	dragged.dataset.folder=folderId;
	const ulli=document.querySelectorAll("ul li,ul ul");
	[...ulli].forEach((value,i)=>{
		value.dataset.row="a"+i;
	});
	saveSort();
}

function dragEnd(e){
	dragIndicator.className="none";
	if(hlFolder)hlFolder.removeAttribute("class");
	startY=0;
	enter=false;
	dragged=false;
}

function addFolder(name){
	name=name?name:i18n("newFolder");
	let lastChild=list.lastElementChild,
		lastId=lastChild?lastChild.dataset.row.substr(1):-1;
	if(lastChild&&lastChild.classList.contains("folder")&&lastChild.childElementCount>1)
		lastId=lastChild.lastElementChild.dataset.row.substr(1);
	let iLi=document.createElement('ul');
		iLi.id=`folder${new Date().getTime()}`;
		iLi.dataset.row=`a${parseInt(lastId)+1}`;
		iLi.dataset.folder="root";
		iLi.draggable=true;
		iLi.addEventListener('dragstart',dragStart);
		iLi.className="folder";
	let iA=document.createElement('a');
		iA.textContent=name;
	iLi.addEventListener("click",e=>{
			e.target.parentElement.classList.toggle("collapsed");
			saveSort();
	});
	iLi.appendChild(iA);
	list.appendChild(iLi);
	saveSort();
	statusbar(i18n("addedWebpage",name));
}

function saveSort(){
	let ulli=document.querySelectorAll("ul li,ul ul"),
		sort=[];
	[...ulli].forEach((value,i)=>{
		let type=value.classList.contains("folder")?"folder":"item",
			name=value.classList.contains("folder")?value.firstElementChild.textContent:"",
			collapsed=value.classList.contains("collapsed")?true:false;
		sort.push([value.id,value.dataset.folder,type,name,collapsed])
	});
	browser.storage.local.set({sort:sort}).then(()=>{
		browser.runtime.sendMessage({"listSite":true});
	});
}
