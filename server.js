const express = require('express');
const os = require('os');

const app = express();
const port = process.env.PORT || 3000;
const appVersion = process.env.APP_VERSION || '1.0.0';

app.get('/', (req, res) => {
    res.json({
        application: 'hello-cicd',
        version: appVersion,
        message: 'Hello from CI/CD Demo',
        timestamp: new Date().toISOString(),
        hostname: os.hostname()
    });
});

app.get('/health', (req, res) => {
    res.status(200).json({
        status: 'UP'
    });
});

app.listen(port, () => {
    console.log(`Application version ${appVersion} listening on port ${port}`);
});
