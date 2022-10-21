const formatTime = msTotal => {

    const milliseconds = String(Math.floor(msTotal % 1000 / 10)).padEnd(2, '0');
    const secondsTotal = Math.floor(msTotal / 1000);
    const minutes = Math.floor(secondsTotal / 60),
          seconds = secondsTotal % 60;

    if(minutes > 0) {
        return `${minutes}:${String(seconds).padStart(2, '0')}.${milliseconds}`;
    }

    return `${secondsTotal}.${milliseconds}`;

};
