(function(){
	document.getElementById("h3options").textContent=browser.i18n.getMessage("options");
	document.getElementById("notificationVolume").textContent=browser.i18n.getMessage("volume");
	document.getElementById("submitSave").textContent=browser.i18n.getMessage("save");
})();

function saveOptions(e){
	let settings={
		notificationVolume: document.getElementById("notificationVolume").value
	};
	browser.storage.local.set({settings:settings});
	e.preventDefault();
}

function restoreOptions() {
	browser.storage.local.get('settings').then(result=>{
		document.getElementById("notificationVolume").value=result.settings.notificationVolume?result.settings.notificationVolume:0.6;
	});
}

document.addEventListener('DOMContentLoaded', restoreOptions);
document.querySelector("form").addEventListener("submit", saveOptions);
