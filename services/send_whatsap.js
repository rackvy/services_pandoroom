const axios = require('axios');

async function sendTemplate(data, token) {
    const url = `https://api.1msg.io/399295/sendTemplate?token=${token}`;

    try {
        const response = await axios.post(url, data, {
            headers: {
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error('Error sending template:', error.response ? error.response.data : error.message);
        throw error;
    }
}

module.exports = {
    sendTemplate
};