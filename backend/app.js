import express from 'express';
import axios from 'axios';
import cheerio from 'cheerio';
import cors from 'cors'; // Importe o pacote cors

const app = express();
const port = 3333;

// Habilita o middleware cors para todas as rotas
app.use(cors());

// Endpoint to scrape Amazon search results
app.get('/api/scrape', async (req, res) => {
  const keyword = req.query.keyword;

  // handle error if keyord is null
  if (!keyword) {
    return res.status(400).json({ error: 'Missing keyword query parameter' });
  }

  try {
    //set html to request
    const searchUrl = `https://www.amazon.com/s?field-keywords=${encodeURIComponent(keyword)}`;

    //get response from amazon
    const response = await axios.get(searchUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/112.0.1347.0 Safari/537.36',
      },
    });

    // if response is ok format data and send in json
    if (response.status === 200) {
      const html = response.data;
      const $ = cheerio.load(html);

      const results = [];

      $('div.s-result-item').each((index, element) => {
        const title = $(element).find('span.a-color-base.a-text-normal').text();
        const rating = $(element).find('span.a-icon-alt').text();
        const reviewCount = $(element).find('span.a-size-base.s-underline-text').text();
        const image = $(element).find('img.s-image').attr('src');

        //get only products and discard everything else
        if(title && rating.length < 30){
          results.push({
            title,
            rating,
            reviewCount,
            image,
          });
        }
      });

      res.json({ results });
    } else {
      res.status(500).json({ error: 'Failed to fetch Amazon search results' });
    }
  } catch (error) {
    res.status(500).json({ error: 'An error occurred while scraping Amazon search results' });
  }
});

app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
