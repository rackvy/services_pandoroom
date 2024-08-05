const express = require('express');
const bodyParser = require('body-parser');
const googleCalendar = require('./services/google_calendar');
const { sendTemplate } = require('./services/send_whatsap');
const { handleTelegramRequest } = require('./services/telegram');
const { handleYandexDiskRequest } = require('./services/yandexDisk');
const { handlePaymentRequest } = require('./services/tinkoffPayment');



const app = express();
const PORT = process.env.PORT || 3000;

app.use(bodyParser.json());

app.post('/google/create-event', (req, res) => {
    const eventData = {
        summary: req.body.summary,
        location: req.body.location,
        description: req.body.description,
        startDateTime: req.body.startDateTime,
        endDateTime: req.body.endDateTime,
        timeZone: req.body.timeZone,
        attendees: req.body.attendees,
    };

    googleCalendar.createEvent(eventData, (err, message) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.status(200).send(message);
    });
});

app.post('/whatsapp/send', async (req, res) => {
    const { location, as, token = '513oehrjo1ospdj3', clientid, books, quest } = req.body;

    let template = 'confirmation_no_animator_14_p_2906';

    if (!template) {
        return res.status(400).send('Invalid location or "as" value');
    }

    const data = {
        template: template,
        language: {
            policy: 'deterministic',
            code: 'ru'
        },
        namespace: 'c2af1424_e363_4b48_bed7_9d61311b6aa9',
        params: [
            {
                type: 'header',
                parameters: [
                    {
                        type: 'text',
                        text: new Date(books.book_time).toLocaleTimeString('ru-RU', { hour: '2-digit', minute: '2-digit' })
                    }
                ]
            },
            {
                type: 'body',
                parameters: [
                    {
                        type: 'text',
                        text: quest.post_title
                    }
                ]
            }
        ],
        phone: clientid.phone
    };

    try {
        const result = await sendTemplate(data, token);
        res.status(200).send(result);
    } catch (error) {
        res.status(500).send('Error sending template');
    }
});

app.post('/telegram', handleTelegramRequest);

app.post('/yandex-disk', handleYandexDiskRequest);

app.post('/payment/create', handlePaymentRequest);



app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});