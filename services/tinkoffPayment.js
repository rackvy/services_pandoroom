const axios = require('axios');
require('dotenv').config();

const TINKOFF_API_URL = 'https://securepay.tinkoff.ru/v2/'; // Основной URL API Тинькофф
const { TINKOFF_TERMINAL_KEY, TINKOFF_SECRET_KEY } = process.env;

function generateSignature(data) {
    const crypto = require('crypto');
    const queryString = Object.keys(data)
        .filter(key => data[key] !== undefined && data[key] !== null)
        .map(key => `${key}=${data[key]}`)
        .sort()
        .join('&');

    const signString = `${queryString}&secret=${TINKOFF_SECRET_KEY}`;
    return crypto.createHash('md5').update(signString).digest('hex').toUpperCase();
}

async function createPaymentOrder(amount, orderId, description) {
    const requestData = {
        TerminalKey: TINKOFF_TERMINAL_KEY,
        Amount: amount * 100, // сумма в копейках
        OrderId: orderId,
        Description: description,
        // Другие параметры могут быть добавлены по необходимости
    };

    requestData.Sign = generateSignature(requestData);

    try {
        const response = await axios.post(`${TINKOFF_API_URL}Init`, requestData);
        if (response.data.Success) {
            return response.data.PaymentURL;
        } else {
            throw new Error(`API Error: ${response.data.Message}`);
        }
    } catch (error) {
        console.error('Error creating payment order:', error.message);
        throw error;
    }
}

async function handlePaymentRequest(req, res) {
    const { amount, orderId, description } = req.body;

    try {
        const paymentLink = await createPaymentOrder(amount, orderId, description);
        res.status(200).json({ paymentLink });
    } catch (error) {
        res.status(500).json({ error: 'Failed to create payment order' });
    }
}

module.exports = {
    handlePaymentRequest
};