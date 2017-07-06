function rqstAdd(url,title,mode,freq,btn=false,icon){
	if(!url)return;
	if(!title)title = url;
	let xhr = new XMLHttpRequest();
	xhr.open("GET", url);
	xhr.overrideMimeType('text/html; charset=utf-8');
	xhr.onload = function (){
		const html_data = this.responseText;
		const site={
			title:  title,
			url:    url,
			date:   date(),
			time:   time(),
			length: html_data.length,
			md5: 	md5(html_data),
			mode:   mode,
			changed:false,
			favicon:icon?icon:"https://icons.better-idea.org/icon?size=16..16..16&url="+url,
			freq:	freq,
			charset:"utf-8"
		};
		browser.storage.local.get().then(result=>{
			let sites = result.sites;
			sites[sites.length] = site;
			let changes = result.changes;
			changes[changes.length]={
				oldHtml: "",
				html: html_data
			};
			browser.storage.local.set({sites:sites,changes:changes});
			if(!btn){
				listSite();
				statusbar(i18n("addedWebpage",title));
			}
		});
		if(btn){
			browser.notifications.create(`webpagesScannerAdded`,{
				"type": "basic",
				"iconUrl": site.favicon,
				"title": i18n("extensionName"),
				"message": i18n("addedWebpage",title)
			});
			setTimeout(()=>{
				browser.notifications.clear(`webpagesScannerAdded`);
			},5000);
		}
	};
	xhr.onerror = function (){
		if(!btn)statusbar(i18n("addedWebpageError"));
		if(btn){
			browser.notifications.create(`webpagesScannerError`,{
				"type": "basic",
				"iconUrl": "icons/warn.svg",
				"title": i18n("extensionName"),
				"message": i18n("errorAdding",title)
			});
			setTimeout(()=>{
				browser.notifications.clear(`webpagesScannerError`);
			},5000);
		}
	}
	xhr.send(null);
}

function scanSite(ev,auto=false,force=false){
	if(!auto){
		scanLater(60);
		hideAll();
	}
	let count=0;
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		const len=sites.length;
		sites.forEach((local,ix)=>{
			if(local.changed){
				count++;
				return;
			}
			if(!force&&auto&&((date()==local.date&&time()<local.time+local.freq)||(date()>local.date&&24-local.time+time()<local.freq))){
				return;
			}
			const charset=local.charset?local.charset:"uft-8";
			let xhr = new XMLHttpRequest();
			xhr.open("GET", local.url,false);
			xhr.overrideMimeType('text/html; charset='+charset);
			xhr.onload = function (){
				const html_data = this.responseText;
				const scanned={
					  length: html_data.length,
					  md5: 	  md5(html_data)
				};
				if((local.mode=="m0"&&(local.length<=scanned.length-10||local.length>=scanned.length+10))||(local.mode=="m3"&&(local.length<=scanned.length-50||local.length>=scanned.length+50))||(local.mode=="m4"&&(local.length<=scanned.length-250||local.length>=scanned.length+250))||(local.mode=="m1"&&local.length!=scanned.length)||(local.mode=="m2"&&local.md5!=scanned.md5)){
					if(!auto){
						document.getElementById("item"+ix).classList.add("changed","scanned");
					}
					count++;
					updateBase(ix,html_data,scanned.md5,scanned.length);
				}else{
					updateTime(ix);
					if(!auto)document.getElementById("item"+ix).classList.add("scanned");
				}
			};
			xhr.onerror = function (){
				if(!auto)document.getElementById("item"+ix).classList.add("error");
			};	
			try{
				xhr.send(null);
			}catch(e){
				console.warn(e);				
			}
			if(!auto)statusbar(`<progress value='${ix}' max='${len}'></progress>`,true);
		});
		if(!auto)statusbar(i18n("scanCompleted"));
	}).then((s)=>{
		if(count){
			let audio=new Audio('notification.opus');
			getSettings().then(s=>{
				audio.volume=(s.notificationVolume/100);
				audio.play();
				if(s.autoOpen)openSite(`webpagesScanner${auto}`);
				if(s.showNotification){
					browser.notifications.create(
						`webpagesScanner${auto}`,{
							"type": "basic",
							"iconUrl": "icons/icon.svg",
							"title": i18n("extensionName"),
							"message": count==1?i18n("oneDetected"):i18n("moreDetected",count)
						}
					).then(()=>{
						if(!s.autoOpen){
							browser.notifications.onClicked.removeListener(openSite);
							browser.notifications.onClicked.addListener(openSite);	 
						}
					});
					setTimeout(()=>{
						browser.notifications.clear(`webpagesScanner${auto}`);
						if(!s.autoOpen)browser.notifications.onClicked.removeListener(openSite);
					},s.notificationTime);
				}
			});
		}
	});
}

function updateBase(id,newHtml,md5,len){
	browser.storage.local.get().then(result=>{
		let changes = result.changes;
		changes[id]={
			oldHtml: changes[id].html,
			html:    newHtml
		};
		let sites = result.sites;
		let obj={
			date:   date(),
			time:   time(),
			length: len,
			md5: 	md5,
			changed:true
		};
		sites[id] = Object.assign(sites[id],obj);
		browser.storage.local.set({sites:sites,changes:changes});
	});
}

function updateTime(id){
	browser.storage.local.get('sites').then(result=>{
		let sites = result.sites;
		let obj={
			date:   date(),
			time:   time()
		};
		sites[id] = Object.assign(sites[id],obj);
		browser.storage.local.set({sites});
	});
}

function openSite(ev){
	const auto=(ev==="webpagesScannertrue")?true:false;
	let ixs=[];
	browser.storage.local.get('sites').then(result=>{
		const sites=result.sites;
		sites.forEach((value,i)=>{
			if(value.changed===true){
				ixs.push(i);
				browser.tabs.create({
					url:`view.html?${i}`,
					active:false
				});
				if(!auto){
					document.getElementsByTagName("li")[i].classList.remove("changed");
				}
			}
		});
		unchange(ixs);
	});
}

function unchange(ixo){
	browser.storage.local.get('sites').then(result=>{
		let sites=result.sites;
		ixo.forEach(function(value){
			let obj={
				changed:false
			}
			sites[value] = Object.assign(sites[value],obj);
		});
		browser.storage.local.set({sites});
	});
}

function scanLater(x){
	let d=new Date();
	let a=Date.parse(d);
	let b=a+x*60*1000;
	browser.alarms.clearAll();
	browser.alarms.create("webpageScanner",{when: b});
}

function time(){
	let d = new Date();
	let h = d.getHours(); 
	let m = d.getMinutes()/100;
	return h+m;
}

function date(){
	let d = new Date();
	let mo = d.getMonth()+1;
	let da = d.getDate()/100; 
	return mo+da;
};

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}

function getSettings(name){
	return browser.storage.local.get('settings').then(result=>{
		return name?result.settings[name]:result.settings;
	});
}
