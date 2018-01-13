let startY,
	enter,
	dragged,
	folderId,
	frag,
	hlFolder;

(function(){
	let list=document.getElementById("lista");
	let nav=document.getElementById("navPanel");
	list.addEventListener('drop',drop);
	list.addEventListener('dragover',dragOver);
	list.addEventListener('dragenter',dragEnter);
	list.addEventListener('dragend',dragEnd);
	list.addEventListener('dragexit',dragExit);
	nav.addEventListener('drop',drop);
	nav.addEventListener('dragover',dragOver);
	nav.addEventListener('dragenter',dragEnter);
	nav.addEventListener('dragend',dragEnd);
})();

function dragStart(e){
	startY=e.clientY;
	e.dataTransfer.setData('text',[]);
	document.getElementById("dragIndicator").style.top=0;
	document.getElementById("dragIndicator").removeAttribute("class");
	dragged=e.target;
}

function dragOver(e){
	if(e.preventDefault)e.preventDefault();
}

function dragExit(e){
	if(enter.firstElementChild.className==="indicator"||enter.parentElement.firstElementChild.className==="indicator")
		hlFolder.removeAttribute("class");
}

function dragEnter(e){
	let toTop=e.clientY<startY;
	enter=e.target.tagName==="A"?e.target.parentElement:e.target.parentElement.parentElement;
	document.getElementById("dragIndicator").style.position="absolute";
	document.getElementById("dragIndicator").style.left=0;
	folderId="root";
	if(dragged===enter||dragged===enter.parentElement||!dragged){
		document.getElementById("dragIndicator").style.top=0;
		return;
	}else if(enter.tagName==="HTML"||enter.tagName==="BODY"){
		if(e.target.id==="lista")document.getElementById("dragIndicator").style.top=e.target.offsetHeight+1+"px";
		else{
			document.getElementById("dragIndicator").style.position="fixed";
			document.getElementById("dragIndicator").style.top=31+"px";	
		}
	}else if(enter.classList.contains("collapsed")&&dragged.classList.contains("folder")){
		if(toTop)document.getElementById("dragIndicator").style.top=enter.offsetTop+"px";
		else document.getElementById("dragIndicator").style.top=enter.offsetTop+31+"px";
	}else if(dragged.classList.contains("folder")&&enter.classList.contains("folder")){
		if(toTop)document.getElementById("dragIndicator").style.top=enter.offsetTop+"px";
		else document.getElementById("dragIndicator").style.top=(enter.lastElementChild.offsetTop+31+"px")||"20px";
	}else if(dragged.classList.contains("folder")&&enter.dataset.folder!=="root"){
		if(toTop)document.getElementById("dragIndicator").style.top=enter.parentElement.offsetTop+"px";
		else document.getElementById("dragIndicator").style.top=enter.parentElement.lastElementChild.offsetTop+31+"px";
	}else if(enter.dataset.folder!=="root"&&dragged.className!=="folder"){
		folderId=enter.dataset.folder;
		if(toTop)document.getElementById("dragIndicator").style.top=enter.offsetTop+"px";
		else document.getElementById("dragIndicator").style.top=enter.offsetTop+31+"px";
		document.getElementById("dragIndicator").style.left="20px";
		hlFolder=enter.parentElement.firstElementChild;
		hlFolder.className="indicator";
	}else if(enter.classList.contains("folder")){
		folderId=enter.id;
		if(enter.className==="folder"){
			document.getElementById("dragIndicator").style.top=enter.lastElementChild.offsetTop+31+"px";
		}else{
			document.getElementById("dragIndicator").style.top=enter.offsetTop+31+"px";
		}
		document.getElementById("dragIndicator").style.left="20px";
		hlFolder=enter.firstElementChild;
		hlFolder.className="indicator";
	}else{
		if(toTop)document.getElementById("dragIndicator").style.top=enter.offsetTop+"px";
		else document.getElementById("dragIndicator").style.top=enter.offsetTop+31+"px";
	}
}

function drop(e){
	if(e.preventDefault)e.preventDefault();
	if(dragged===enter||dragged===enter.parentElement||!dragged)return;
	let toTop=e.clientY<startY;
	let toBottom=e.clientY>startY;
	frag=document.createDocumentFragment();
	frag.appendChild(dragged);
	let iList=document.getElementById("lista");
	if(enter.tagName==="HTML"||enter.tagName==="BODY"){
		if(toTop)iList.insertBefore(frag,iList.firstElementChild);
		else iList.appendChild(frag);
	}else if(dragged.classList.contains("folder")&&enter.dataset.folder!=="root"){
		if(toTop)iList.insertBefore(frag,enter.parentElement);
		else if(enter.parentElement.nextElementSibling)iList.insertBefore(frag,enter.parentElement.nextElementSibling);
		else iList.appendChild(frag);
	}else if(enter.classList.contains("folder")&&dragged.classList.contains("folder")){
		if(toTop)iList.insertBefore(frag,enter);
		else if(enter.nextElementSibling)iList.insertBefore(frag,enter.nextElementSibling);
		else iList.appendChild(frag);
	}else if(enter.classList.contains("folder")){
		enter.appendChild(frag);
	}else if(folderId!=="root"){
		if(toTop)document.getElementById(folderId).insertBefore(frag,enter);
		else if(enter.nextElementSibling)document.getElementById(folderId).insertBefore(frag,enter.nextElementSibling);
		else document.getElementById(folderId).appendChild(frag);
	}else if(toTop)iList.insertBefore(frag,enter);
	else if(enter.nextElementSibling&&toBottom)iList.insertBefore(frag,enter.nextElementSibling);
	else if(!enter.nextElementSibling&&toBottom)iList.appendChild(frag);
	dragged.dataset.folder=folderId;
	ulli=document.querySelectorAll("ul li,ul ul"),
	[...ulli].forEach((value,i)=>{
		value.dataset.row="a"+i;
	});
	saveSort();
}

function dragEnd(e){
	document.getElementById("dragIndicator").className="none";
	if(hlFolder)hlFolder.removeAttribute("class");
	startY=0;
	enter=false;
	dragged=false;
}

function addFolder(name){
	name=name?name:i18n("newFolder");
	let list=document.getElementById("lista"),
		lastChild=list.lastElementChild,
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
	let iImg=document.createElement('img');
		iImg.className="folderIcon";
		iImg.src="icons/blank.svg";
		iImg.draggable=false;
	iLi.addEventListener("click",e=>{
			e.target.parentElement.classList.toggle("collapsed");
			saveSort();
	});
	iImg.addEventListener("click",e=>{
			e.target.parentElement.parentElement.classList.toggle("collapsed");
			saveSort();
	});
	iA.insertBefore(iImg,iA.firstChild);
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
	browser.storage.local.set({sort:sort});
	browser.runtime.sendMessage({"listSite":true});
}
