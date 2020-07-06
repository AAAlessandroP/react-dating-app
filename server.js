var express = require("express");
var bodyParser = require("body-parser");
const crypto = require("crypto");
var assert = require("assert");
const fetch = require('node-fetch');
const fs = require("fs");
const cors = require("cors");
const MongoClient = require("mongodb").MongoClient;
require('dotenv').config()
var app = express();
const helmet = require("helmet");
// app.use(helmet());
// app.use(helmet.contentSecurityPolicy({
//     directives: {
//         defaultSrc: ["'self'"],
//         styleSrc: ["'self'", 'maxcdn.bootstrapcdn.com']
//     }
// }))
app.use(bodyParser.urlencoded({ extended: false, limit: 50 * 1024 * 1024 }));
app.use(bodyParser.json({
    limit: 50 * 1024
}));

const session = require('express-session')
const RedisStore = require('connect-redis')(session)
const Redis = require('ioredis')
// const { ObjectId } = require("mongodb");
// app.use(express.static("mia_pag"));
// app.use(express.static("public")); //il suo file a.b è raggiungibile con /a.b
// "use strict";
let port = process.env.PORT;
if (port == null) {
    port = 3000;
}
app.listen(port);
app.use(cors())
const client = new Redis(14133, process.env.REDIS_ENDP, { db: 0, password: process.env.REDIS_PASSW })
const store = new RedisStore({ client })
const cookie_name = "sid"
app.use(
    session({
        store,
        unset: "destroy",
        name: cookie_name,
        saveUninitialized: true,//a true permette di mantenere la sessione anche se req.session non viene toccato, altrimenti tutte le richieste che non modificano req.session sarebbero indistinguibili (salvo una precedente req che lo facesse)
        // con saveUninitialized: true la sessione permane anche tra + req che non toccano req.session
        resave: false,
        secret: `quiet, pal! it's a secret!`,
        cookie: {
            maxAge: 1000 * 60 * 60 * 1, //If the session cookie has a expires date, connect-redis will use it as the TTL.
            sameSite: false,
            secure: false
        }
    })
)

// PER REACT
const path = require('path');
app.use(express.static(path.join(__dirname, 'build')));
app.get(/^\/(?!api).*/, function (req, res) {// tutte le non-api-reqs vanno al js di index.html
    res.sendFile(path.join(__dirname, 'build', 'index.html'), err => console.error(err));
});
// END-PER REACT


// // posso manipolare le sessioni a mano con STORE.get() e STORE.set(), lui le salva lì


// if (process.env.NODE_ENV == 'production')
//     home_sito = "https://my-forum101.herokuapp.com"
// else
home_sito = "http://localhost:" + port

const uri = `mongodb+srv://dating:${process.env.MONGO_PASS}@miocluster2-igwb8.mongodb.net/test?retryWrites=true&w=majority`;



app.post("/api/login", async (req, res) => {

    var Name = req.body.utente;
    var pass = req.body.passw;
    try {
        var db = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        var user = await db.db("dating").collection("utenti").findOne({ Name });
        console.log(`user`, user);
        if (user && user.HashedPwd === h(user.Salt + pass)) {
            req.session.lui = {
                IDUtente: user._id,
                Utente: user.Name,
            }
            res.redirect("/");
            console.log(`/login x req.sessionID`, req.sessionID);
        } else res.redirect("/error");
    } catch (error) {
        console.log(`error`, error);
        res.redirect("/error");
    }
    finally {
        db.close()
    }
});

// info su di me
app.get("/api/me", async (req, res) => {
    console.log(`api/me req.sessionid`, req.sessionID);
    if (req.session.lui != undefined) {
        res.setHeader("X-logged", req.session.lui.IDUtente)
        res.json(req.session.lui);
    }
    else {
        res.setHeader("X-logged", "no")
        res.json({});
    }
});



app.post("/api/addUser", /*[check('utente').escape()],*/ async (req, res) => {
    var Name = req.body.name;
    var pass = req.body.passw;

    var Salt = crypto.randomBytes(32).toString("hex");

    try {
        var db = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        var giaPresente = await db.db("dating").collection("utenti").findOne({ Name });
        if (!giaPresente) {
            //lui non c'era

            var nuovo_utente = {
                Name,
                Salt,
                HashedPwd: h(Salt + pass)
            };
            try {
                var user = await db.db("dating").collection("utenti").insertOne(nuovo_utente, { safe: true, upsert: true });
                user = user.ops[0]
                assert.notEqual(user, null)
                req.session.lui = {
                    IDUtente: user._id,
                    Utente: user.Name
                }
                res.sendStatus(201);
                console.log(201)
            } catch (error) {
                console.log(`error`, error);
                res.sendStatus(500);
            }
        } else res.status(409).send("username already taken");

        db.close();
    } catch (error) {
        console.log(`error`, error);
        res.sendStatus(500);
        db.close()
    }
});

function loggedChecker(req, res, next) {
    // console.log("req.session.lui", req.session.lui)
    // console.log(`req.sessionID`, req.sessionID)
    if (req.session.lui != undefined) {
        next()
    } else
        res.sendStatus(401)
}

app.post("/api/logout", loggedChecker, async (req, res) => {
    req.session.destroy((err) => console.log(err));
    store.destroy(req.sessionID, err => {
        if (err) console.log(err)
    })
    res.clearCookie(cookie_name)
    res.sendStatus(200)
});


function h(s) {
    var hash = crypto.createHash("sha256");
    hash.update(s);
    return hash.digest("base64");
}

app.get("/api/users", async (req, res) => {

    try {
        // var db = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
        // var dati = await db
        //     .db("forum")
        //     .collection("utenti")
        //     .find({ confirmed: { $eq: true } })
        //     .project({ Name: 1, picUrl: 1 })
        //     .toArray();
        let users = JSON.parse('[{"_id":"5eca4939bde6ab000417b235","Name":"ale","picUrl":"https://i.imgur.com/PpXCbtV.png","info":"mi piacciono le angurie."},{"_id":"5eca5c38065044312e151496","Name":"elez","picUrl":"https://i.imgur.com/2Zd27uQ.png"},{"_id":"5eca4939bde6ab000417b236","Name":"pippo","picUrl":"https://i.imgur.com/ucwOSBX.jpeg"}]')

        res.json(users);
    } catch (error) {
        console.log(`error`, error);
        res.sendStatus(500);
    }
    // db.close()
});

// // var Page = require("./userPage")
// // var LoggedPage = require("./userPageLogged")
app.get("/api/users/:uid", async (req, res) => {
    var uid = req.params.uid
    console.log(`uid`, uid);
    res.json({ name: "pippo", picUrl: "https://aleprezio.altervista.org/8", info: "amante della fava." })
});
//     if (uid && uid != "undefined") {
//         try {
//             uid = ObjectId(uid)
//         } catch (error) {
//             // l'id è quello corto di gh/fb allra
//             uid = ObjectId(uid.toString().padStart(24, "0"))
//         }
//     } else {
//         res.sendStatus(400)
//         return;
//     }
//     var db = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//     let him = await db.db("dating").collection("utenti").findOne({ _id: uid })
//     let hisPosts = await db.db("dating").collection("messaggi").find({ by: uid }).toArray()
//     db.close()
//     hisPosts = hisPosts.reverse() //ord crono inverso
//     var data = {};
//     hisPosts.forEach(element => {
//         let gg = Math.floor(element.Date / 8.64e7);//giorni dal 1970
//         if (data[gg] === undefined)
//             data[gg] = 1
//         else
//             data[gg]++
//     });

//     if (!him) {//user non c'è
//         res.send("pagina non disponibile. utente cancellato? <button onclick=\"goBack()\">Go Back</button><script>function goBack() {window.history.back();}</script> ")
//         return;
//     }

//     if (!req.session.lui || req.session.lui.IDUtente != uid)//o non loggato o non sua-> solo vedere
//         res.send(Page.page(uid, him, hisPosts))
//     else
//         res.send(LoggedPage.page(uid, him, hisPosts, req.session.lui ? req.session.lui.masto : null, result.string))
// });

// app.post("/nuovoNome", loggedChecker, async (req, res) => {
//     var Name = req.body.nome
//     try {
//         var db = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//         await db.db("dating").collection("utenti").findOneAndUpdate({ _id: ObjectId(req.session.lui.IDUtente) }, { $set: { Name } });
//         req.session.lui.Utente = Name
//         res.sendStatus(200)
//     } catch (error) {
//         console.log(`error`, error);
//         res.sendStatus(500)
//     }
//     db.close()
// });

// app.post("/delProfile", loggedChecker, async (req, res) => {
//     try {
//         var db = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//         await db.db("dating").collection("utenti").deleteOne({ _id: ObjectId(req.session.lui.IDUtente) });
//         res.sendStatus(200)
//     } catch (error) {
//         console.log(`error`, error);
//         res.sendStatus(500)
//     }
//     db.close()
// });

// var aws = require('aws-sdk');
// var multer = require('multer')
// var multerS3 = require('multer-s3')
// var config = new aws.Config({

//     accessKeyId: process.env.accessKeyId,
//     secretAccessKey: process.env.secretAccessKey,
//     region: 'eu-de',
//     endpoint: 's3.eu-de.cloud-object-storage.appdomain.cloud',
//     s3BucketEndpoint: false
// });
// var s3 = new aws.S3(config)

// //scarica e ritorna un img dal bucket
// async function getImage(Key) {
//     const data = s3.getObject(
//         {
//             Bucket: process.env.bucketName,
//             Key: Key.toString()
//         }
//     ).promise();
//     return data;//Buffer
// }


// app.get("/user/:uid/pic", async (req, res) => {
//     var db = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//     let him = await db.db("dating").collection("utenti").findOne({ _id: ObjectId(req.params.uid.padStart(24, "0")) })
//     if (!him.picUrl) {
//         res.redirect("https://raw.githubusercontent.com/Infernus101/ProfileUI/0690f5e61a9f7af02c30342d4d6414a630de47fc/icon.png")
//     } else {
//         if (him.picOnCloud) {
//             // getImage(ObjectId(req.params.uid.padStart(24, "0")))
//             //     .then((img) => {
//             //         res.setHeader('Content-Type', 'image/jpeg');
//             //         res.send(img.Body)
//             //     });
//             res.redirect("https://s3.eu-de.cloud-object-storage.appdomain.cloud/forum/" + req.params.uid.padStart(24, "0"));
//         } else
//             res.redirect(him.picUrl);
//     }
// });

// var upload = multer({
//     storage: multerS3({
//         s3: s3,
//         bucket: process.env.bucketName,
//         metadata: function (req, file, cb) {
//             console.log(`file`, file);
//             cb(null, { fieldName: file.fieldname });
//         },
//         key: function (req, file, cb) {
//             cb(null, req.session.lui.IDUtente)//userid is its name
//         }
//     })
// })

// app.post('/modificaPic', loggedChecker,
//     upload.single('newPicc'), async function (req, res, next) {
//         // console.log(`req.body`, req.body);is the url (empty or not)
//         // console.log(`req.files`, req.files);populated by multer if we first upload.array
//         // console.log(`req.file`, req.file);populated by multer if we first call upload.single
//         try {
//             var db = await MongoClient.connect(uri, { useNewUrlParser: true, useUnifiedTopology: true });
//             if (req.file) {

//                 await db.db("dating").collection("utenti").findOneAndUpdate({ _id: ObjectId(req.session.lui.IDUtente) },
//                     { $set: { picUrl: "https://s3.eu-de.cloud-object-storage.appdomain.cloud/forum/" + req.session.lui.IDUtente.padStart(24, "0") } })
//                 res.sendStatus(200)

//             } else {//it's a url

//                 await db.db("dating").collection("utenti").findOneAndUpdate({ _id: ObjectId(req.session.lui.IDUtente) },
//                     { $set: { picUrl: req.body.newPicUrl } })

//                 res.sendStatus(200)
//             }

//         } catch (error) {
//             console.log(`error`, error);
//             res.sendStatus(500)
//             db.close()
//         }
//         db.close()
//     });

