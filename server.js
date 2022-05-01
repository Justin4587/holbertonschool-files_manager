import express from 'express';
import router from './routes/index';

const app = express();
const port = process.env.PORT || 5000;

app.use(router);

app.listen(port, () => {
  const mess = 'Server listening on port: ';
  const message = mess + port;
  console.log(message);
});

export default app;
