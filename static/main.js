const timerElement = document.getElementById("timer"),
      inspectWarning = document.getElementById("inspect-warning");

const formatTime = msTotal => {

    const milliseconds = String(Math.floor(msTotal % 1000 / 10)).padStart(2, '0');
    const secondsTotal = Math.floor(msTotal / 1000);
    const minutes = Math.floor(secondsTotal / 60),
          seconds = secondsTotal % 60;

    if(minutes > 0) {
        return `${minutes}:${String(seconds).padStart(2, '0')}.${milliseconds}`;
    }

    return `${secondsTotal}.${milliseconds}`;

};

const options = {
    spacePressTime: 550,
    showInspectionTime: true,
    showSolveTime: true
};

// timer state
const TimerState = {
    IDLE: "idle",
    BEFORE_INSPECT: "before inspect",
    INSPECTION: "inspect",
    SPACE_PRESSED: "space pressed",
    READY: "ready",
    RUNNING: "running"
};

let timer = {
    state: TimerState.IDLE,
    lastTime: 0,
    changeState: targetState => {
        
        if(targetState == TimerState.SPACE_PRESSED)
            timerElement.classList.add("space-pressed");
        else
            timerElement.classList.remove("space-pressed");

        if(targetState == TimerState.READY || targetState == TimerState.BEFORE_INSPECT)
            timerElement.classList.add("ready");
        else
            timerElement.classList.remove("ready");

        if(targetState == TimerState.RUNNING)
            inspectWarning.textContent = "";

        if(timer.becomeReadyTimeout && timer.targetState != TimerState.READY) {
            clearTimeout(timer.becomeReadyTimeout);
            timer.becomeReadyTimeout = null;
        }

        if(targetState == TimerState.INSPECTION) {
            if(timer.state == TimerState.BEFORE_INSPECT) {
                timer.inspectionStartTime = performance.now();
            }
        } else if(targetState == TimerState.SPACE_PRESSED) {
            timer.becomeReadyTimeout = setTimeout(() => timer.changeState(TimerState.READY), options.spacePressTime);
        } else if(targetState == TimerState.RUNNING) {
            timer.solveStartTime = performance.now();
        }

        timer.state = targetState;

    }
}; 

// timer controls
window.addEventListener("keydown", event => {
    
    // ignore repeat keypressses 
    if(event.repeat) return;

    if(timer.state == TimerState.RUNNING) {
        timer.changeState(TimerState.IDLE);
        const time = performance.now() - timer.solveStartTime;
        timer.lastTime = time;
    } else if(event.key == " ") {
        if(timer.state == TimerState.IDLE) {
            timer.changeState(TimerState.BEFORE_INSPECT);
        } else if(timer.state == TimerState.INSPECTION) {
            timer.changeState(TimerState.SPACE_PRESSED);
        }
    }

});

window.addEventListener("keyup", event => {

    // if the timer is running, any keypress stops the clock
    if(timer.state == TimerState.RUNNING) {
        timer.changeState(TimerState.IDLE);
    } else if(event.key == " ") {

        if(timer.state == TimerState.BEFORE_INSPECT || timer.state == TimerState.SPACE_PRESSED) {
            timer.changeState(TimerState.INSPECTION);
        } else if(timer.state == TimerState.READY) {
            timer.changeState(TimerState.RUNNING);
        }

    }

});

const animateTimer = () => {

    if(timer.state == TimerState.INSPECTION || timer.state == TimerState.SPACE_PRESSED || timer.state == TimerState.READY) {
        
        const elapsed = performance.now() - timer.inspectionStartTime;
        if(elapsed > 15000) {
            inspectWarning.textContent = "";
        } else if(elapsed > 12000) {
            inspectWarning.textContent = "12 seconds";
        } else if(elapsed > 8000) {
            inspectWarning.textContent = "8 seconds";
        }

        if(elapsed < 15000) {
            if(options.showInspectionTime) {
                timerElement.textContent = Math.ceil(15 - elapsed / 1000);
            } else {
                timerElement.textContent = "inspect";
            }
        } else if(elapsed < 17000) {
            timerElement.textContent = "+2";
        }  else {
            timerElement.textContent = "DNF";
        }

    } else if(timer.state == TimerState.RUNNING) {
        if(options.showSolveTime) {
            timerElement.textContent = formatTime(performance.now() - timer.solveStartTime);
        } else {
            timerElement.textContent = "solve!";
        }
    } else {
        timerElement.textContent = formatTime(timer.lastTime);
    }

    requestAnimationFrame(animateTimer);
};

animateTimer();