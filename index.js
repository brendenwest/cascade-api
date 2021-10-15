const cheerio = require('cheerio');
const https = require('https');
const express = require("express");
const app = express();

app.set("port", process.env.PORT || 3000);
app.use(express.static(__dirname + '/public')); // allows direct navigation to static files

const BASE_URL = "https://cascade.org/";

const getRide = (element) => {
    let title = $(element).find("h3").text()
    let url = $(element).find("a").attr("href")
    let date = $(element).find(".date-display-single").text()
    let pace = $(element).find(".field-name-field-daily-pace").text()
    let distance = $(element).find(".field-name-field-daily-distance").text()
    let leader = $(element).find(".field-name-field-daily-rideleader").text()
    let locations = $(element).find(".field-name-field-location-address").text()
    return { title, url, date, pace, distance, leader, locations}
}

const getNews = (element) => {
    let title = $(element).find(".field-name-title").text()
    let author = $(element).find(".field-name-author").text()
    let body = $(element).find(".field-name-body").text()
    let postDate = $(element).find(".field-name-post-date").text()
    let url = $(element).find(".field-name-node-link").find("a").attr("href")
    let category = $(element).find(".field-name-field-blog-category").text()
    let image = $(element).find(".field-name-global-image").find("img").attr("src")

    return { title, url, postDate, body, author, category, image}
}

app.get('/', (req,res) => {
    res.send('home');
});

app.get('/:section', (req,res, next) => {
    const url = `${BASE_URL}${req.params.section}/`
    console.log(url)

    https.get(url, (response) => {

        let data = [];
        // { title: "", image_url: "", description: "", url: ""}

        // Continuously update stream with data
        let body = '';
        response.on('data', (d) => {
            body += d;
        });

        response.on('end', () => {
            $ = cheerio.load(body);
            switch (req.params.section) {
              case 'calendar':
                $('.views-row').each((index, element) => {
                    item = getRide(element);
                    data.push(item)
                });
              case 'blog':
                $('.node-blog').each((index, element) => {
                    item = getNews(element);
                    data.push(item)
                });
              default:
                console.log('no match');
                }
            res.json(data);
        })
    }).end();
});

// define 404 handler
app.use((req,res) => {
    res.type('text/plain');
    res.status(404);
    res.send('404 - Not found');
});

app.listen(app.get('port'), () => {
    console.log('Express started');
});