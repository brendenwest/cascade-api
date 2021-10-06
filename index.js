const cheerio = require('cheerio');
const https = require('https');
const express = require("express");
const app = express();

app.set("port", process.env.PORT || 3000);
app.use(express.static(__dirname + '/public')); // allows direct navigation to static files

const BASE_URL = "https://cascade.org/"

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
            $('.views-row').each((index, element) => {
                console.log(index)
                let title = $(element).find("h3").text()
                let url = $(element).find("a").attr("href")
                let date = $(element).find(".date-display-single").text()
                let pace = $(element).find(".field-name-field-daily-pace").text()
                let distance = $(element).find(".field-name-field-daily-distance").text()
                let leader = $(element).find(".field-name-field-daily-rideleader").text()
                let locations = $(element).find(".field-name-field-location-address").text()
                data.push(
                  { title, url, date, pace, distance, leader, locations}
                )
            });
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