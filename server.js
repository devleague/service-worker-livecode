const express = require('express');
const bodyParser = require('body-parser');

const PORT = 8081;

const app = express();
app.use(bodyParser.json());

app.get('/api/data', (req, res) => {
  res.json({ status: 'ok' });
});

app.post('/api/newData', (req, res) => {
  console.log(req.body);

  return res.json({ status: 'complete' });
});

app.listen(PORT, () => {
  console.log(`Server started on PORT: ${PORT}`);
});
