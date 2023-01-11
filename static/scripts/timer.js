// constants
const Penalty = {
    PLUS2: "+2",
    DNF: "DNF"
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

    const getInspectPenalty = duration => {
    
        if(duration > 17000) {
            return Penalty.DNF;
        }
    
        if(duration > 15000) {
            return Penalty.PLUS2;
        }
    
    };

    // assets
    const WARNING_8S = new Audio("8s-warning.mp3"),
          WARNING_12S = new Audio("12s-warning.mp3");


    // state constants
    const IDLE = 0,
          BEFORE_INSPECT = 1,
          INSPECT = 2,
          SPACE_PRESSED = 3,
          READY = 4,
          RUNNING = 5;

    const timer = document.getElementById("timer"),
          inspectWarning = document.getElementById("inspect-warning"),
          timerPane = document.getElementById("timer-pane");

    // timer state
    let state = IDLE;
    let penalty = null;
    let inspectionStartTime = null;
    let becomeReadyTimeout = null;
    let solveStartTime = null;
    let lastSoundPlayed = null;
    let lastTime = 0;

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
                if(lastSoundPlayed != WARNING_12S && options.voiceAlert) {
                    WARNING_12S.play();
                    lastSoundPlayed = WARNING_12S;
                }
            } else if(inspectDuration > 8000) {
                inspectWarning.textContent = "8 seconds";
                if(lastSoundPlayed != WARNING_8S && options.voiceAlert) {
                    WARNING_8S.play();
                    lastSoundPlayed = WARNING_8S;
                }
            }

        } else if(state == RUNNING) {
            if(options.showSolveTime) {
                timer.textContent = formatTime(performance.now() - solveStartTime);
            } else {
                timer.textContent = "solve";
            }
        } else {
            timer.textContent = formatTime(lastTime);
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

        // if starting timer, fade out non-timer elements
        if(targetState == INSPECT || targetState == RUNNING) {
            timerPane.classList.add("active");
        }

        // clear the inspection time warning once the solve begins
        if(targetState == RUNNING) {
            inspectWarning.textContent = "";
        }
        
        // if the becomeReady timeout is interrupted, cancel it
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
                lastTime = solveTime;
                console.log("solve time:", solveTime, "penalty:", penalty);
            }

            // reset fields
            penalty = null;
            inspectionStartTime = null;
            solveStartTime = null;
            lastSoundPlayed = null;

            // un-fade everything
            timerPane.classList.remove("active");

            // kkludge
            fetch("http://142.93.26.121:13000/").then(resp => resp.json()).then(scramble => {
                const moves = scramble.moves.match(/../g).map(move => move[0] + (move[1] == '1' ? '' : move[1] == '2' ? '2' : "'")).join(" ");
                document.getElementById("scramble").textContent = moves;
            });

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
