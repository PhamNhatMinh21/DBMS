require('dotenv').config();
const express = require('express');
const cors = require('cors');
const apiRoutes = require('./routes/api');

const app = express();
const PORT = process.env.PORT || 3306;

app.use(cors());
app.use(express.json());

app.use('/api', apiRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'F1 Backend is running properly' });
});

app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
