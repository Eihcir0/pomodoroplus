import * as https from 'https';
import * as querystring from 'querystring';

export const makeSlackRequest = (
    data: any,
    token: string,
    json: boolean = true,
    path: string,
): void => {

    const postData = json
        ? JSON.stringify(data)
        : querystring.stringify(data);

    const reqParams = {
        hostname: 'slack.com',
        port: 443,
        path,
        method: 'POST',
        headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': json
                ? 'application/json; charset=utf-8'
                : 'application/x-www-form-urlencoded',
        },
    };

    const callBack = (res: any) => {
        res.on('data', (d: any) => {
            // console.log('data: ' + d);
        });
    };

    const req = https.request(reqParams, callBack);
    req.on('error', e => {
        console.error(e);
    });

    req.write(postData);

    req.end();
};