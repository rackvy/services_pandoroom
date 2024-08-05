const axios = require('axios');
require('dotenv').config(); // Загрузка переменных окружения
const { YANDEX_OAUTH_TOKEN } = process.env;

const BASE_URL = 'https://cloud-api.yandex.net/v1/disk';

async function getPhotosFromFolder(folderSlug, dateTime) {
    try {
        const folderUrl = `${BASE_URL}/resources?path=${encodeURIComponent(folderSlug)}`;
        console.log(`Fetching folder contents from: ${folderUrl}`);

        const folderResponse = await axios.get(folderUrl, {
            headers: {
                'Authorization': `OAuth ${YANDEX_OAUTH_TOKEN}`
            }
        });

        console.log('Folder response data:', folderResponse.data);

        const files = folderResponse.data._embedded.items;

        const givenDateTime = new Date(dateTime);
        const lowerBound = new Date(givenDateTime.getTime() - 30 * 60 * 1000); // 30 минут назад
        const upperBound = new Date(givenDateTime.getTime() + 30 * 60 * 1000); // 30 минут вперед

        console.log('Date range:', lowerBound, upperBound);

        const filteredFiles = files.filter(file => {
            const fileDate = new Date(file.created);
            return fileDate >= lowerBound && fileDate <= upperBound;
        });

        console.log('Filtered files:', filteredFiles);

        const links = await Promise.all(filteredFiles.map(async (file) => {
            try {
                const downloadUrl = `${BASE_URL}/resources/download?path=${encodeURIComponent(file.path)}`;
                console.log(`Fetching download URL from: ${downloadUrl}`);

                const downloadResponse = await axios.get(downloadUrl, {
                    headers: {
                        'Authorization': `OAuth ${YANDEX_OAUTH_TOKEN}`
                    }
                });
                return downloadResponse.data.href;
            } catch (downloadError) {
                console.error('Error fetching download URL:', downloadError.response ? downloadError.response.data : downloadError.message);
                return null;
            }
        }));

        return links.filter(link => link !== null);
    } catch (error) {
        console.error('Error accessing Yandex Disk:', error.response ? error.response.data : error.message);
        throw error;
    }
}

async function handleYandexDiskRequest(req, res) {
    const { slug, dateTime } = req.body;

    try {
        const downloadLinks = await getPhotosFromFolder(slug, dateTime);
        res.status(200).json({ links: downloadLinks });
    } catch (error) {
        res.status(500).json({ error: 'Failed to fetch photos' });
    }
}

module.exports = {
    handleYandexDiskRequest
};