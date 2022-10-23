// constants
const Penalty = {
    PLUS2: "+2",
    DNF: "DNF"
};

const getInspectPenalty = duration => {
    
    if(duration > 17000) {
        return Penalty.DNF;
    }

    if(duration > 15000) {
        return Penalty.PLUS2;
    }

};

// globals
const options = {
    spacePressTime: 550,
    showInspectionTime: true,
    showSolveTime: true,
    useInspection: true
};

const formatTime = msTotal => {

    const fractionalPart = String(Math.floor(msTotal % 1000 / 10)).padStart(2, '0');
    const secondsTotal = Math.floor(msTotal / 1000),
          minutes = Math.floor(secondsTotal / 60),
          seconds = secondsTotal % 60;

    if(minutes > 0) {
        return `${minutes}:${String(seconds).padStart(2, '0')}.${fractionalPart}`;
    }

    return `${secondsTotal}.${fractionalPart}`;

};

const createTimer = () => {

    // state constants
    const IDLE = 0,
          BEFORE_INSPECT = 1,
          INSPECT = 2,
          SPACE_PRESSED = 3,
          READY = 4,
          RUNNING = 5;

    // penalties
    const PLUS2 = 0,
          DNF = 1;

    const timer = document.getElementById("timer"),
          inspectWarning = document.getElementById("inspect-warning"),
          timerPane = document.getElementById("timer-pane");

    // timer state
    let state = IDLE;
    let penalty = null;
    let inspectionStartTime = null;
    let becomeReadyTimeout = null;
    let solveStartTime = null;

    const updateTimer = () => { 
        
        if(state == INSPECT || options.useInspection && (state == SPACE_PRESSED || state == READY)) {

            const inspectDuration = performance.now() - inspectionStartTime;
            const penalty = getInspectPenalty(inspectDuration);

            // update main timer text
            if(penalty) {
                timer.textContent = penalty;
            } else if(options.showInspectionTime) {
                timer.textContent = Math.ceil(15 - inspectDuration / 1000);
            } else {
                timer.textContent = "inspect";
            }

            // show warning
            if(inspectDuration > 12000) {
                inspectWarning.textContent = "12 seconds";
            } else if(inspectDuration > 8000) {
                inspectWarning.textContent = "8 seconds";
            }

        } else if(state == RUNNING) {
            if(options.showSolveTime) {
                timer.textContent = formatTime(performance.now() - solveStartTime);
            } else {
                timer.textContent = "solve!";
            }
        }

        requestAnimationFrame(updateTimer);

    };

    updateTimer();

    const changeState = targetState => {

        // update timer element classes
        if(targetState == SPACE_PRESSED) {
            timer.classList.add("not-ready");
        } else {
            timer.classList.remove("not-ready");
        }

        if(targetState == READY || targetState == BEFORE_INSPECT) {
            timer.classList.add("ready");
        } else {
            timer.classList.remove("ready");
        }

        // clear the inspection time warning once the solve begins
        if(targetState == RUNNING) {
            inspectWarning.textContent = "";
        }
        
        // if the become ready timeout is interrupted, cancel it
        if(becomeReadyTimeout && targetState != READY) {
            clearTimeout(becomeReadyTimeout);
            becomeReadyTimeout = null;
        }

        if(state == BEFORE_INSPECT && targetState == INSPECT) {
            inspectionStartTime = performance.now();
        } else if(targetState == SPACE_PRESSED) {
            becomeReadyTimeout = setTimeout(() => changeState(READY), options.spacePressTime);
        } else if(targetState == RUNNING) {
            
            // begin the solve
            const now = performance.now();
            solveStartTime = now;

            // check if any penalties need to be applied
            if(options.useInspection) {
                penalty = getInspectPenalty(now - inspectionStartTime);
            }

        } else if(targetState == IDLE) {

            if(state == RUNNING) {
                const solveTime = performance.now() - solveStartTime;
                console.log("solve time:", solveTime, "penalty:", penalty);
            }

            // reset fields
            penalty = null;
            inspectionStartTime = null;
            solveStartTime = null;

        }

        state = targetState;

    };

    const onTriggerPressed = () => {

        if(state == IDLE) {
            if(options.useInspection) {
                changeState(BEFORE_INSPECT);
            } else {
                changeState(SPACE_PRESSED);
            }
        } else if(state == INSPECT) {
            changeState(SPACE_PRESSED);
        }

    };

    const onTriggerReleased = () => {

        if(state == BEFORE_INSPECT) {
            changeState(INSPECT);
        } else if(state == SPACE_PRESSED) {
            if(options.useInspection) {
                changeState(INSPECT);
            } else {
                changeState(IDLE);
            }
        } else if(state == READY) {
            changeState(RUNNING);
        }

    };

    window.addEventListener("keydown", event => {
        
        // ignore repeat keypresses
        if(event.repeat) return;

        if(state == RUNNING) {
            changeState(IDLE);
        } else if(event.key == " ") {
            onTriggerPressed();
        }

    });

    window.addEventListener("keyup", event => {
        if(event.key === " ") {
            onTriggerReleased();
        }
    });

    timerPane.addEventListener("touchstart", event => {
        if(state == RUNNING) {
            changeState(IDLE);
        } else {
            onTriggerPressed();
        }
        event.preventDefault();
    });

    timerPane.addEventListener("touchend", event => {
        onTriggerReleased();
        event.preventDefault();
    });

};

const timer = createTimer();