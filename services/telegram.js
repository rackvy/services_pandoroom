const axios = require('axios');
const { TELEGRAM_BOT_TOKEN } = process.env; // Загрузка токена из переменных окружения

const BASE_URL = `https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}`;

async function sendMessage(chatId, messageText, threadId = null) {
    const url = threadId
        ? `${BASE_URL}/sendMessage`
        : `${BASE_URL}/sendMessage`;

    try {
        const response = await axios.post(url, {
            chat_id: chatId,
            text: messageText,
            message_thread_id: threadId
        });
        return response.data;
    } catch (error) {
        console.error('Error sending message:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function createOrUpdateThread(chatId, threadId, title, iconCustomEmojiId = null) {
    const url = `${BASE_URL}/editForumTopic`;

    try {
        const response = await axios.post(url, {
            chat_id: chatId,
            message_thread_id: threadId,
            name: title,
            icon_custom_emoji_id: iconCustomEmojiId
        });
        return response.data;
    } catch (error) {
        console.error('Error creating or updating thread:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function handleTelegramRequest(req, res) {
    const { chatId, messageText, threadId, threadTitle, iconCustomEmojiId } = req.body;

    try {
        let result;

        if (threadId) {
            // Если указан идентификатор треда, обновляем тред и отправляем сообщение в тред
            await createOrUpdateThread(chatId, threadId, threadTitle, iconCustomEmojiId);
            result = await sendMessage(chatId, messageText, threadId);
        } else {
            // Если идентификатор треда не указан, отправляем сообщение в чат
            result = await sendMessage(chatId, messageText);
        }

        res.status(200).json(result);
    } catch (error) {
        res.status(500).json({ error: 'Failed to process request' });
    }
}

module.exports = {
    handleTelegramRequest
};