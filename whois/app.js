console.clear();
var express = require('express');
const app = express();
const bodyParser = require('body-parser');
const fileupload = require('express-fileupload');
const whois = require('whois-json');
const { parse, tldExists } = require('tldjs');
const XRegExp = require('xregexp');
const { MongoClient } = require('mongodb');
const { json } = require('express');


app.set('view engine', 'ejs');
app.use(express.json());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(fileupload());
var isTLD = false;
app.get("/", (req, res, next) => {
    res.render('index', { isTLD });
})
app.get('/whois', async(req, res, next) => {
    const url1 = req.query.url;
    const url = regEx(url1);
    //  console.log(req.query);
    if (tldExists(url)) {

        // console.log(text);

        var query = await queryDB(url, res);

    } else {
        isTLD = true;
        res.render('index', { isTLD });
    }

})



async function getWhois(url) {
    var results = await whois(url);
    // console.log(JSON.stringify(results, null, 2));
    const data = JSON.stringify(results, null, 2);
    var data_array = data.split(',');
    return data_array;

}

function regEx(url) {
    var result
    var match
    if (match = url.match(/^(?:https?:\/\/)?(?:[^@\n]+@)?(?:www\.)?([^:\/\n\?\=]+)/im)) {
        result = match[1]
        if (match = result.match(/^[^\.]+\.(.+\..+)$/)) {
            result = match[1]
        }
    }
    console.log(result);
    return result;
}



async function insertDB(url, json) {
    MongoClient.connect("mongodb://localhost:27017/mydb", function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        var obj = {
            "url": url,
            "whois": json
        };
        //  console.log(obj);
        dbo.collection("url").insertOne(obj, function(err, res) {
            if (err) throw err;
            console.log("1 document inserted");
            db.close();
        });
    });
}

async function queryDB(url, res) {
    var query;
    MongoClient.connect("mongodb://localhost:27017/mydb", function(err, db) {
        if (err) throw err;
        var dbo = db.db("mydb");
        dbo.collection("url").find({ url: url }).toArray(async function(err, result) {
            if (err) throw err;

            if (Object.keys(result).length == 0) {
                const data_array = await getWhois(url);
                insertDB(url, data_array);
                res.render('whois', { url, data_array });
            } else {
                //  console.log(result[0]);
                console.log("query fetched from database");
                var data_array = result[0].whois;

                res.render('whois', { url, data_array });
            }

            db.close();
        });
    });
}
//queryDB();

app.listen(3000, () => {
    console.log('http server running');
});