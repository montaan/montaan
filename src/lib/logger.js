const fs = require('fs');

module.exports = function(accessLog='log/access.log', errorLog='log/error.log') {

    const accessFd = fs.openSync(accessLog, 'a+');
    const errorFd = fs.openSync(errorLog, 'a+');

    const logRequest = function(obj, error) {
        var str, fd;
        if (error) {
            str = JSON.stringify(obj.concat([error])) + '\n';
            fd = errorFd;
        } else {
            str = JSON.stringify(obj) + '\n';
            fd = accessFd;
        }
        fs.write(fd, str, function(err, written, str) {
            if (err) {
                console.error(str);
            }
        });
    };

    return logRequest;

};