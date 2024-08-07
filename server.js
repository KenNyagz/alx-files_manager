import express from 'express';
import router from './routes/index';

const port = process.env.PORT || 5000;
const app = express();

app.use(express.json({ limit: '20mb' }));
app.use(express.urlencoded({ extended: false, limit: '20mb' }));

app.use('/', router);

app.listen(port, () => console.log(`Server listening on port ${port}`));
