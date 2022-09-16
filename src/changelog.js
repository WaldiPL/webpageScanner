"use strict";

let changelogGenerated=false;

function generateChangelog(){
	if(changelogGenerated){
		return;
	}
	changelogGenerated=true;

	let changelog=`[
	{"version":"2.1.5",
		"changes":["Moved part of the database to indexedDB","Speeded up page loading and extension performance","Added the possibility to select a file as notification sound","Updated appearance and icons to Proton style","Added dark theme for options","Added automatic theme","Minor changes","Fixed bugs"],
		"changesPL":["Przeniesiono część bazy danych do indexedDB","Przyśpieszono ładowanie stron i działanie rozszerzenia","Dodano możliwość wybrania pliku jako dźwięku powiadomienia","Zaktualizowano wygląd i ikony do stylu Proton","Dodano ciemny motyw opcji","Dodano motyw automatyczny","Drobne zmiany","Naprawiono błędy"]
	},
	{"version":"2.1.0",
		"changes":["Fixed problems with partial scanning","#60","Fixed not working notification","Improved import and export of folders","#63","#64","Added possibility to drag and drop bookmarks, folders, links and web pages","#65","Added German language (thanks to Omnibrain007)","#68","Added possibility to sort pages","#45","Minor changes","#59","Fixed bugs"],
		"changesPL":["Naprawiono problemy ze skanowaniem częściowym","#60","#69","Naprawiono niedziałające powiadomienie","Poprawiono importowanie i eksportowanie folderów","#63","#64","Dodano możliwość przeciągania i upuszczania zakładek, folderów, odnośników i stron","#65","Dodano język niemiecki (dzięki Omnibrain007)","#68","Dodano możliwość sortowania stron","#45","Drobne zmiany","#59","Naprawiono błędy"]
	},
	{"version":"2.0.1",
		"changes":["Added possibility to save only a selected element of a page in the database","Fixed bug","#58"],
		"changesPL":["Dodano możliwość zapisywania w bazie danych tylko wybranego elementu strony","Naprawiono błąd","#58"]
	},
	{"version":"2.0.0",
		"changes":["Added a new popup for adding a page","#49","Moved a page editing to a separate popup","Added possibility to ignore all HTML attributes","#54","Added possibility to ignore page styles","Fixed a problem with detecting changes after editing page properties","Improved selecting of elements and popup in partial scan mode","Added a warning on a page preview if the partial scan element does not exist or there are problems with scanning","Added notification if the page is already on the scan list","#47","Added notification about a new extension version","Minor visual and other changes","Fixed bugs","#56"],
		"changesPL":["Dodano nowe okienko dodawania strony","#49","Przeniesiono edytowanie strony do oddzielnego okienka","Dodano możliwość ignorowania wszystkich atrybutów HTML","#54","Dodano możliwość ignorowania stylów strony","Naprawiono problem z wykrywaniem zmian po edycji właściwości strony","Poprawiono wskazywanie elementów i okienko w trybie skanowania częściowego","Dodano ostrzeżenie w podglądzie strony, jeśli element skanowania częściowego nie istnieje lub wystąpiły problemy ze skanowaniem","Dodane powiadomienie, jeśli strona znajduje się już na liście skanowania","#47","Dodano powiadomienie o nowej wersji rozszerzenia","Drobne zmiany wizualne i inne","Naprawiono błędy","#56"]
	},
	{"version":"1.9.6.1",
		"changes":["Added possibility to change 'default values' (interval, mode, etc.)","#48","Added possibility to ignore link addresses","#52","Added possibility to delete HTML comments","#51","Moved execution of some functions from sidebar to background","Minor changes","Fiexed bugs","#53"],
		"changesPL":["Dodano możliwość zmiany 'wartości domyślnych' (interwał, tryb, itp.)","#48","Dodano możliwość ignorowania adresów odnośników","#52","Dodano możliwość usunięcia komentarzy HTML","#51","Przeniesiono wykonywanie niektórtch funkcji z panelu bocznego do tła","Drobne zmiany","Naprawiono błędy","#53"]
	},
	{"version":"1.9.5",
		"changes":["Fixed bug","#36","Added possibility to change options individually for each pages","Added possibility to delete JS scripts","Added links to GitHub in 'Changelog'","Added possibility to change sound of the notification","Added possibility to stop openning next pages (Middle-click the button on a toolbar)","#42","Minor changes","Fixed bugs"],
		"changesPL":["Naprawiono błąd","#36","Dodano możliwość zmiany opcji indywidualnie dla każdej strony","Dodano możliwość usunięcia skryptów JS","Dodano odnośniki do GitHuba w 'Historii zmian' ","Dodano możliwość zmiany dźwięku powiadomienia","Dodano możliwość zatrzymania otwierania kolejnych stron (Kliknięcie środkowym przyciskiem myszy przycisku na pasku narzędzi)","#42","Drobne zmiany","Naprawiono błędy"]
	},
	{"version":"1.9.4",
		"changes":["Added possibility to change the 'Favicon service' (Native, Google, DuckDuckGo)","#31","Added possibility to ignore changes in numbers","Added change markers on a scrollbar"],
		"changesPL":["Dodano mozliwość zmiany 'Usługi ikon stron' (Natywna, Google, DuckDuckGo)","#31","Dodano możliwość ignorowania zmian liczb","Dodano znaczniki zmian na pasku przewijania"]
	},
	{"version":"1.9.3",
		"changes":["Fixed major bug"],
		"changesPL":["Naprawiono poważny błąd"]
	},
	{"version":"1.9.2",
		"changes":["Added possibility to hide changes outside the scanned element","#35","#41","Fixed bugs","Minor changes"],
		"changesPL":["Dodano możliwość ukrycia zmian poza skanowanym elementem","#35","#41","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.9.1",
		"changes":["Added dark theme for 'preview' and 'popup'","Fixed bugs"],
		"changesPL":["Dodano ciemny motyw dla 'podglądu' oraz 'wyskakującego okna'","Naprawiono błędy"]
	},
	{"version":"1.9.0",
		"changes":["Fixed problem with displaying some pages","Improved the display of text files","#32","Added a link to 'Scan list' in options","#30","Added date and time for the 'old and new version of the page'","Minor changes","[dev] Pages are displayed in a 'iframe' element"],
		"changesPL":["Naprawiono problem z wyświetlaniem niektórtch stron","Ulepszono wyświetlanie plików tekstowych","#32","Dodano odnośnik do 'Listy skanowania' w opcjach","#30","Dodano datę i czas dla 'nowej i starej wersji strony'","Drobne zmiany","[dev] Strony wyświetlane są w elemencie 'iframe'"]
	},
	{"version":"1.8.5",
		"changes":["Added possibility to scan a part of the page","#29","Fixed bugs","Minor changes"],
		"changesPL":["Dodano możliwość skanowania części strony","#29","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.8.1",
		"changes":["New view - 'Raw data'","Updated interface","Fixed bugs","Minor changes"],
		"changesPL":["Nowy widok - 'Surowe dane'","Zaktualizowano interfejs","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.8.0",
		"changes":["Added possibility to scan an entire folder","Added possibility to open all pages in the folder (middle mouse button or ctrl + left mouse button)","Folders that contain changed pages are highlighted","Added French language (Mozinet-fr)","#25","Added a 'clear' button to the search bar","Added an animation of opening / closing folders","Improved sorting pages","Fixed bugs","Minor changes"],
		"changesPL":["Dodano możliwość skanowania całego folderu","Dodano możliwość otwarcia wszystkich stron w folderze (środkowy przycisk myszy lub ctrl + lewy przycisk myszy)","Foldery zawierające zmienione strony są podświetlone","Dodano język francuski (Mozinet-fr)","#25","Dodano przycisk 'wyczyść' do paska wyszukiwania","Dodano animację otwierania/zamykania folderów","Usprawniono sortowanie stron","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.7.4",
		"changes":["Added possibility to change the keyboard shortcut","Restored progress bar","Fixed bugs","Minor changes"],
		"changesPL":["Dodano możliwość zmiany skrótu klawiaturowego","Przywrócono pasek postępu","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.7.3",
		"changes":["Strict mode for JS","Fixed bug","#21"],
		"changesPL":["Tryb ścisły dla JS","Naprawiono błąd","#21"]
	},
	{"version":"1.7.2",
		"changes":["Fixed major bug"],
		"changesPL":["Naprawiono poważny błąd"]
	},
	{"version":"1.7.1",
		"changes":["Added possibility to set the delay in the opening pages in new tabs","Minor changes","Fixed bugs"],
		"changesPL":["Dodano możliwość ustawienia opóźnienia w otwieraniu stron w nowych kartach","Drobne zmiany","Naprawiono błędy"]
	},
	{"version":"1.7.0",
		"changes":["Added search bar","Added possibility to set the scanning frequency in minutes","#19","Minor changes","Fixed bugs"],
		"changesPL":["Dodano pasek wyszukiwania","Dodano możliwość ustawienia częstotliwości skanowania w minutach","#19","Drobne zmiany","Naprawiono błędy"]
	},
	{"version":"1.6.7",
		"changes":["Improved function to import pages from a bookmark folder","Minor changes","Fixed bugs"],
		"changesPL":["Ulepszono funkcję importowania stron z folderu zakładek","Drobne zmiany","Naprawiono błędy"]
	},
	{"version":"1.6.6",
		"changes":["Access to the bookmarks requires permission","Favicons are generated by the Google service","Favicons are saved in the database as base64","Fixed bugs"],
		"changesPL":["Dostęp do zakładek wymaga pozwolenia","Ikony stron generowane są przez usługę Google","Ikony stron zapisane są w bazie danych w formacie base64","Naprawiono błędy"]
	},
	{"version":"1.6.5",
		"changes":["Added possibility to disable automatic scanning","Added possibility to stop scanning individual pages","Added possibility to change the frequency of automatic scanner startup","Fixed bugs","Minor changes"],
		"changesPL":["Dodano możliwość wyłączenia automatycznego skanowania","Dodano możliwość zatrzymania skanowania poszczególnych stron","Dodano możliwość zmiany częstotliwości automatycznego uruchamiania skanera","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.6.0",
		"changes":["Added possibility to delete duplicates","Added possibility to delete broken pages","Broken pages are marked as gray","Fixed bugs","Minor changes"],
		"changesPL":["Dodano zakładkę 'zarządzanie'","Dodano możliwość usuwania duplikatów","Dodano możliwość usuwania niedziałających stron","Niedziałające strony są oznacznone jako szare","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.5.6",
		"changes":["Fixed bugs"],
		"changesPL":["Naprawiono błędy"]
	},
	{"version":"1.5.5",
		"changes":["Possibility to import / export pages to a bookmark folder"],
		"changesPL":["Możliwość importowania / eksportowania stron do folderu zakładek"]
	},
	{"version":"1.5.2",
		"changes":["Added possibility to change the default charset","#18","Fixed bugs","Minor changes"],
		"changesPL":["Dodano możliwość zmiany domyślnego kodowania tekstu","#18","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.5.0",
		"changes":["Reorganized options","Added 'Changelog' and 'Support'","Added possibility to restore a backup","Fixed bugs","Minor changes"],
		"changesPL":["Przeorganizowano opcje","Dodano 'Historię zmian' oraz 'Wsparcie'","Dodano możliwość przywrócenia kopii zapasowej","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.4.0",
		"changes":["Added 'next/previous change' buttons","#16","Fixed problem with blank page","#15","Fixed bugs","Minor changes"],
		"changesPL":["Dodano przyciski 'poprzednia/następna zmiana'","#16","Naprawiono problem z pustą stroną","#15","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.3.6",
		"changes":["Added possibility to name the folder before it was created"],
		"changesPL":["Dodano możliwość nazwania folderu przed jego utworzeniem"]
	},
	{"version":"1.3.5",
		"changes":["Added dark theme"],
		"changesPL":["Dodano ciemny motyw"]
	},
	{"version":"1.3.4",
		"changes":["The possibility to create a backup","Updated light theme","Minor changes"],
		"changesPL":["Dodano możliwość utworzenia kopii zapasowej","Zaktualizowano jasny motyw","Drobne zmiany"]
	},
	{"version":"1.3.3",
		"changes":["Fixed bugs","Minor changes"],
		"changesPL":["Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.3.2",
		"changes":["Added possibility to accurately set the scan frequency","Fixed bugs"],
		"changesPL":["Dodano możliwość dokładnego ustawienia częstotliwości skanowania","Naprawiono błędy"]
	},
	{"version":"1.3.1",
		"changes":["Added highlighting for the folder","Fixed bug"],
		"changesPL":["Dodano podświetlenie dla folderów","Naprawiono błędy"]
	},
	{"version":"1.3.0",
		"changes":["Added possibility to sort and create folders","#1","Restored context menu to input fields","Fixed bugs","Minor changes"],
		"changesPL":["Dodano mozliwość sortowania i tworzenia folderów","#1","Przywrócono menu kontekstowe dla pól tekstowych","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.2.6",
		"changes":["Replaced innerHTML by DOM Parser"],
		"changesPL":["Zastąpiono innerHTML przez DOM Parser"]
	},
	{"version":"1.2.5",
		"changes":["Added possibility to display the scan list on the popup","Blocked text selection in the scan list","Added 'Fill' button to 'Add new page' panel","Minor changes"],
		"changesPL":["Dodano możliwość wyświetlania listy skanowania na wyskakującym oknie","Zablokowano zaznaczanie tekstu na liscie skanowania","Dodano przycisk 'Uzupełnij' do panelu 'Dodaj nową stronę'","Drobne zmiany"]
	},
	{"version":"1.2.4",
		"changes":["Added a badge to a toolbar button","The 'open changed pages' button is hidden if automatic opening is active","Added 'open changed pages' button to popup","Fixed bugs","Minor changes"],
		"changesPL":["Dodano znaczek do przycisku paska narzędzi","Przycisk 'otwórz zmienione strony' jest ukryty jeśli automatyczne otwieranie jest aktywne","Dodano przycisk 'otwórz zmienone strony' do wyskakującego okna","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.2.3",
		"changes":["More accurate comparison script. (Compares every word, not whole paragraphs)","Possibility to restore old script (via settings)","Automatically hidden statusbar","Views do not contain data are disabled","Minor chages"],
		"changesPL":["Dokładniejszy skrypt porównujący. (Porównuje każde słowo, nie całe praragrafy)","Możliwość przywrócenia starego skryptu (przez ustawienia)","Automatyczne ukrywanie paska statusu","Widoki nie zawierające danych są zablokowane","Drobne zmiany"]
	},
	{"version":"1.2.2",
		"changes":["More settings","Automatic save settings","The possibility to open pages in a new window","New view - 'deleted elements'","Minor chages"],
		"changesPL":["Więcej ustawień","Automatyczne zapisywanie ustawień","Możliwość otwierania stron w nowym oknie","Nowy widok - 'usunięte elementy'","Drobne zmiany"]
	},
	{"version":"1.2.0",
		"changes":["Asynchronous scanning (now it's only a few seconds)","Maximum query time for one page is 10s","Context buttons are displayed for only one page at a time","Removed progressbar","Fixed bugs","Minor changes and optimization"],
		"changesPL":["Asynchroniczne skanowanie (teraz to tylko kilka sekund)","Maksymalny czas skanowania dla jednej strony to 10 sekund","Przyciski kontekstowe są wyświetlane tylko dla jednej strony","Usunięto pasek postępu","Naprawiono błędy","Drobne zmiany i optymalizacje"]
	},
	{"version":"1.1.2",
		"changes":["Added 'scan this page' button to the context menu","Updated manifest file","Minor changes"],
		"changesPL":["Dodano przycisk 'skanuj tę stronę' do menu kontekstowego","Zaktualizowano plik manifest","Drobne zmiany"]
	},
	{"version":"1.1.1",
		"changes":["Removed unused file","Fixed bugs","Minor changes and optimizations"],
		"changesPL":["Usunięto nieużywany plik","Naprawiono błędy","Drobne zmiany i optymalizacje"]
	},
	{"version":"1.1.0",
		"changes":["Added setting for auto-hide interface","Minor changes"],
		"changesPL":["Dodano ustawienie dla automatycznego ukrywania interfejsu","Drobne zmiany"]
	},
	{"version":"1.0.9",
		"changes":["All icons changed to svg","Added possibility to hide the interface","Fixed bug","Minor changes"],
		"changesPL":["Wszystki ikony zmienone na svg","Dodano możliwość ukrycia interfejsu","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.0.8",
		"changes":["Added style for changed links","Code optimization","Fixed bugs","Minor changes"],
		"changesPL":["Dodano styl dla zmienoych odnośników","Zoptymalizowano kod","Naprawiono błędy","Drobne zmiany"]
	},
	{"version":"1.0.7",
		"changes":["Added settings","Added a shortcut to the settings","Improved sidebar (faster loading)","Fixed bugs"],
		"changesPL":["Dodano ustawienia","Dodano skrót do ustawień","Ulepszono panel boczny (szybsze ładowanie)","Naprawiono błędy"]
	},
	{"version":"1.0.6",
		"changes":["Added settings (volume control)","Added page title in 'new elements' view"],
		"changesPL":["Dodano ustawienia (kontrola głośności)","Dodano tytuł strony w widoku 'nowe elementy'"]
	},
	{"version":"1.0.5",
		"changes":["Fixed problem with loading styles etc., when the link starts with // (eg //example.com)","Changed mp3 file to opus"],
		"changesPL":["Naprawiono problem z ładowanie stylów itp., jeśli link zaczynał się od // (np. //example.com)","Zmienono plik mp3 na opus"]
	},
	{"version":"1.0.4",
		"changes":["Fixed bug","Optimized svg"],
		"changesPL":["Naprawiono błąd","Zoptymalizowano svg"]
	},
	{"version":"1.0.3",
		"changes":["Added notification sound"],
		"changesPL":["Dodano dźwięk powiadomień"]
	},
	{"version":"1.0.2",
		"changes":["'InnerHTML' is replaced by 'textContent'","New translation system (html files)","Minor changes"],
		"changesPL":["'Inner HTML' zastąpiono przez 'textContent'","Nowy system tłumaczenia (pliki html)","Drobne zmiany"]
	},
	{"version":"1.0",
		"changes":["Initial release"],
		"changesPL":["Pierwsze wydanie"]
	}
	]`;

	let container=document.getElementById("changelog"),
		lang=browser.i18n.getUILanguage(),
		versionText=browser.i18n.getMessage("version");
	JSON.parse(changelog).forEach(v=>{
		let article=document.createElement("article"),
			h3=document.createElement("h3"),
			ul=document.createElement("ul"),
			changes=lang==="pl"?v.changesPL:v.changes;
		h3.textContent=versionText+v.version;
		changes.forEach(c=>{
			let li=document.createElement("li");
			if(c.length>3){
				li.textContent=c;
				ul.appendChild(li);
			}else{
				let git=document.createElement("a");
					git.target="_blank";
					git.href="https://github.com/WaldiPL/webpageScanner/issues/"+c.substring(1);
					git.textContent=c;
				ul.lastElementChild.append(" ",git);
			}
		});
		article.appendChild(h3);
		article.appendChild(ul);
		container.appendChild(article);
	});
}
