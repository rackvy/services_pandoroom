const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

const SCOPES = ['https://www.googleapis.com/auth/calendar'];
const CREDENTIALS_PATH = path.join(__dirname, '../credentials.json');
const TOKEN_PATH = path.join(__dirname, '../token.json');

function authorize(callback) {
    fs.readFile(CREDENTIALS_PATH, (err, content) => {
        if (err) return console.log('Error loading client secret file:', err);

        const credentials = JSON.parse(content);
        const { client_secret, client_id, redirect_uris } = credentials.web;

        if (!redirect_uris || redirect_uris.length === 0) {
            return console.error('Redirect URIs are missing in credentials.json');
        }

        const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

        fs.readFile(TOKEN_PATH, (err, token) => {
            if (err) return getAccessToken(oAuth2Client, callback);
            oAuth2Client.setCredentials(JSON.parse(token));
            callback(oAuth2Client);
        });
    });
}

function getAccessToken(oAuth2Client, callback) {
    const authUrl = oAuth2Client.generateAuthUrl({
        access_type: 'offline',
        scope: SCOPES,
    });
    console.log('Authorize this app by visiting this url:', authUrl);

    const readline = require('readline');
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });
    rl.question('Enter the code from that page here: ', (code) => {
        rl.close();
        oAuth2Client.getToken(code, (err, token) => {
            if (err) return console.error('Error retrieving access token', err);
            oAuth2Client.setCredentials(token);
            fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
                if (err) console.error(err);
                console.log('Token stored to', TOKEN_PATH);
            });
            callback(oAuth2Client);
        });
    });
}

function createEvent(eventData, callback) {
    authorize((auth) => {
        const calendar = google.calendar({ version: 'v3', auth });
        const event = {
            summary: eventData.summary,
            location: eventData.location,
            description: eventData.description,
            start: {
                dateTime: eventData.startDateTime,
                timeZone: eventData.timeZone,
            },
            end: {
                dateTime: eventData.endDateTime,
                timeZone: eventData.timeZone,
            },
            attendees: eventData.attendees.map(email => ({ email })),
        };

        calendar.events.insert(
            {
                auth: auth,
                calendarId: 'primary',
                resource: event,
            },
            (err, event) => {
                if (err) {
                    console.log('There was an error contacting the Calendar service: ' + err);
                    return callback('Error creating event');
                }
                console.log('Event created: %s', event.data.htmlLink);
                callback(null, 'Event created: ' + event.data.htmlLink);
            }
        );
    });
}

module.exports = {
    createEvent
};