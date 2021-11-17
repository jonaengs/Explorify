export function groupBy(rawData, key) {
    return rawData.reduce(function(previousVal, currentVal) {
        (previousVal[currentVal[key]] = previousVal[currentVal[key]] || []).push(currentVal);
        return previousVal;
    }, {});
};

export function msToTime(duration) {
    if (isNaN(duration))
        duration = 0;
    let milliseconds = Math.floor((duration % 1000) / 100),
        seconds = Math.floor((duration / 1000) % 60),
        minutes = Math.floor((duration / (1000 * 60)) % 60),
        hours = Math.floor((duration / (1000 * 60 * 60)) % 24);

    hours = (hours < 10) ? "0" + hours : hours;
    minutes = (minutes < 10) ? "0" + minutes : minutes;
    seconds = (seconds < 10) ? "0" + seconds : seconds;

    return hours + ":" + minutes + ":" + seconds;
}

export function comparator(first, second) {
    return second[1] - first[1];
}