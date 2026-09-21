const express = require('express');

const app = express();

app.use(express.json());

app.get('/', (req, res) => {
    res.send('AI Grievance System Backend is Running!');
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'success',
        message: 'Backend is working correctly'
    });
});

app.listen(3000, () => {
    console.log('Server running on port 3000');
});