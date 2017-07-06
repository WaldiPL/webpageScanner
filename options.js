(function(){
	translate();
	document.getElementById("notificationVolume").addEventListener("change",e=>{document.getElementById("oVolume").value=e.target.value;});
	document.getElementById("notificationTime").addEventListener("change",e=>{document.getElementById("oTime").value=parseInt(e.target.value/1000);});
	document.getElementById("showNotification").addEventListener("change",e=>{
		let checked=e.target.checked;
		document.getElementById("trTime").className=checked;
		document.getElementById("notificationTime").disabled=!checked;
	});
	document.addEventListener("DOMContentLoaded",restoreOptions);
	document.getElementById("optionsForm").addEventListener("submit",saveOptions);
})();

function saveOptions(e){
	let settings={
		notificationVolume:	parseInt(document.getElementById("notificationVolume").value),
		notificationTime:	parseInt(document.getElementById("notificationTime").value),
		showNotification:	document.getElementById("showNotification").checked,
		autoOpen:			document.getElementById("autoOpen").checked,
		defaultView:		document.getElementById("defaultView").value
	};
	browser.storage.local.set({settings:settings});
	e.preventDefault();
}

function restoreOptions(){
	browser.storage.local.get('settings').then(result=>{
		let s=result.settings;
		let notificationVolume=s.notificationVolume;
		let notificationTime=s.notificationTime;
		document.getElementById("notificationVolume").value=notificationVolume;
		document.getElementById("oVolume").value=notificationVolume;
		document.getElementById("notificationTime").value=notificationTime;
		document.getElementById("oTime").value=parseInt(notificationTime/1000);
		document.getElementById("autoOpen").checked=s.autoOpen;
		document.getElementById("showNotification").checked=s.showNotification;
		document.getElementById("defaultView").value=s.defaultView;
		document.getElementById("trTime").className=s.showNotification;
		document.getElementById("notificationTime").disabled=!s.showNotification;
	});
}

function translate(){
	document.getElementById("h2options").textContent=i18n("options");
	document.getElementById("thGeneral").textContent=i18n("general");
	document.getElementById("labelAutoOpen").textContent=i18n("autoOpen");
	document.getElementById("labelDefaultView").textContent=i18n("defaultView");
	let defaultViewSelect=document.getElementById("defaultView").options;
		defaultViewSelect[0].text=i18n("highlight");
		defaultViewSelect[1].text=i18n("newElements");
		defaultViewSelect[2].text=i18n("newVersion");
		defaultViewSelect[3].text=i18n("oldVersion");
	document.getElementById("thNotifications").textContent=i18n("notifications");
	document.getElementById("labelShow").textContent=i18n("showNotification");
	document.getElementById("volumeLabel").textContent=i18n("volume");
	document.getElementById("timeLabel").textContent=i18n("notificationTime");
	document.getElementById("submitSave").textContent=i18n("save");
}

function i18n(e,s1){
	return browser.i18n.getMessage(e,s1);
}
