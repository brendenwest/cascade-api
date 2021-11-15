const cheerio = require('cheerio');
const https = require('https');
const express = require("express");
const app = express();

app.set("port", process.env.PORT || 3000);
app.use(express.static(__dirname + '/public')); // allows direct navigation to static files

const BASE_URL = "https://cascade.org/";

const getRides = (element) => {
    let title = $(element).find("h3").text()
    let url = $(element).find("a").attr("href")
    let date = $(element).find(".date-display-single").text()
    let pace = $(element).find(".field-name-field-daily-pace").text()
    let distance = $(element).find(".field-name-field-daily-distance").text()
    let leader = $(element).find(".field-name-field-daily-rideleader").text()
    let location = getLocation($(element).find(".field-name-field-location-address"));
    return { title, url, date, pace, distance, leader, location}
}

const getLocation = (element) => {
    return {
     "street": `${$(element).find(".thoroughfare").text()}, ${$(element).find(".premise").text()}`,
     "city": $(element).find(".locality").text(),
     "state": $(element).find(".state").text(),
     "postal-code": $(element).find(".postal-code").text(),
     "google-map-link": $(element).find(".google-map-link").find("a").attr("href")
    }
}

const getDailyRide = (element) => {
    let title = $(element).find("h3").text()

    let pace = $(element).find(".field-name-field-daily-pace").find(".field-item").text();
    let distance = $(element).find(".field-name-field-daily-distance").find(".field-item").text();
    let elevation = $(element).find(".field-name-field-daily-elevation").find(".field-item").text();
    let datetime = $(element).find(".field-name-field-global-datetime").find(".field-item").text();
    let terrain = $(element).find(".field-name-field-daily-terrain").find(".field-item").text();
    let regroup = $(element).find(".field-name-field-daily-regroup").find(".field-item").text();
    let weather = $(element).find(".field-name-field-daily-weather").find(".field-item").text();
    let interests = $(element).find(".field-name-field-global-interests").find(".field-item").text();
    let description = $(element).find(".field-name-body").find(".field-item").text();
    let links = $(element).find(".field-name-field-daily-links").find("a").attr("href");
    let contact = {
        "name": $(element).find(".field-name-field-contact-name").text(),
        "email": $(element).find(".field-name-field-contact-email").text(),
        "phone": $(element).find(".field-name-field-contact-phone").text()
    }
    let location = getLocation($(element).find(".field-name-field-location-address"))

    return { title, datetime, pace, distance, elevation, terrain, regroup, weather, interests, description, links, contact, location}
}

const getNews = (element) => {
    let title = $(element).find(".field-name-title").text()
    let author = $(element).find(".field-name-author").text()
    let body = $(element).find(".field-name-body").text()
    let postDate = $(element).find(".field-name-post-date").text()
    let url = $(element).find(".field-name-node-link").find("a").attr("href")
    let category = $(element).find(".field-name-field-blog-category").text()
    let image = $(element).find(".field-name-field-global-image").find("img").attr("src")

    return { title, url, postDate, body, author, category, image}
}

app.get('/', (req,res) => {
    res.send('home');
});

app.get('/:section/:id?', (req,res, next) => {
    let url = `${BASE_URL}${req.params.section}/`
    if (req.params.id) {
        url = url + req.params.id;
    }
    if (req.query.page) {
        url = `${url}?page=${req.query.page}`;
    }

    https.get(url, (response) => {

        let data = [];

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
                    item = getRides(element);
                    data.push(item)
                });
                break;
              case 'blog':
                $('.node-blog').each((index, element) => {
                    item = getNews(element);
                    data.push(item)
                });
                break;
              case 'node':
                data = getDailyRide($('.node-daily-ride'));
                data['title'] = $('.page-title').text();
                break;
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