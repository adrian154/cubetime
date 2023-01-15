// globals
const options = {
    spacePressTime: 550,
    showInspectionTime: true,
    showSolveTime: true,
    useInspection: true,
    voiceAlert: true
};

const timer = createTimer();

// add events for nav button
const setupNavButtons = () => {

    // map of pane ID -> button ID
    const PANES = {
        "info-pane": "nav-info",
        "timer-pane": "nav-timer",
        "settings-pane": "nav-settings"
    };

    let currentPane = null,
        currentPaneButton = null;

    for(const paneID in PANES) {

        const pane = document.getElementById(paneID);
        const button = document.getElementById(PANES[paneID]);
        
        button.addEventListener("click", () => {
            if(currentPane) {
                currentPane.style.display = "none";
                currentPaneButton.classList.remove("current");
            }
            pane.style.display = "";
            button.classList.add("current");
            currentPane = pane;
            currentPaneButton = button;
        });

        if(paneID === "timer-pane") {
            button.click();
        }

    }

};

setupNavButtons();

// register service worker
navigator.serviceWorker?.register("/service-worker.js");