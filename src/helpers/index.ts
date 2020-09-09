export const formatDate = (unixTimestamp: number) => {
    const date = new Date(unixTimestamp);
    var hours = date.getHours();
    const minutes = date.getMinutes() || 0;
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    const displayMinutes =
        minutes < 10 ? `${'0' + minutes}` : minutes;
    return hours + ':' + displayMinutes + ' ' + ampm;
}
