const express = require("express");
const fs = require("fs/promises");
const jwt = require("jsonwebtoken");
const app = express();
const PORT = process.env.PORT||3000;
const SECRET_KEY = process.env.SECRET_KEY || 'rahasia';

const users = 'users.json';
const teachers = 'teacher.json';
// const users = require('./users.json')
// const teachers = require('./teacher.json')

app.use(express.json());
app.use(express.urlencoded({ extended : true}));

/**
 * @param {string} path
 * @returns {data: data, err: err} return
 */

// membaca data
async function getData(path) {
    try {
        const data = await JSON.parse( await fs.readFile(path, {encoding : 'utf-8'} ));
        return {
            data : data,
            error : null
        };
    } catch (err) {
        return{
            data : null,
            error : err.message
        };
    }
}

/**
 * @param {object[]} userInDb
 * @param {object} userInput
 * @returns {object}
 */

// pengecekan
function cek(userInDb, userInput) {
    const userFilter = userInDb.filter(user => user.username === userInput.username && user.password === userInput.password)

    if (userFilter.length === 0) {
        return {
            user: null,
            message: 'username atau password salah'
        };
    }
    return {
        user: userFilter[0],
        message: `selamat datang ${userFilter[0].username}`
    }
}

/**
 * @param {object} user
 * @param {string} secretKey
 * @returns
 */

//buat token
function buatToken(user, secretKey) {
    try {
        const token = jwt.sign({ data: {id : user.id, user: user.username}},secretKey);
        return {token: token, err: null}
    } catch (err) {
        return {
            token : null,
            err : err.message
        }
    }
}

/** mengambil data dari token
 * @param {string} token
 * @param {string} secretKey
 * @returns
 */
function buatDataToken(token, secretKey) {
    try {
        const dataToken = jwt.verify(token, secretKey);
        
        if (dataToken.data === null) {
            throw Error('data kosong')
        }
        return {
            data: dataToken.data,
            err: null
        }
    } catch (err) {
        return {
            data : null,
            err : err.message
        }
    }
}


// miidleware
function autentikasi(req, res, next) {
    const getToken = req.headers['auth'];
    if(!getToken) return res.status(401).json({message:'error'});

    const {data, err} = buatDataToken(buatToken, SECRET_KEY);
    if (err !== null) {
        console.log(err)
        return res.status(401).json({message: 'error'});
    }

    req.user = data //hasil
    return next();
}
app.get("/", async (req, res) => {
res.send("okey")
})

// login
app.post("/login", async (req, res) => {
    const dataUser = req.body; // merekam data
    const {data, error} = await getData(users); //ambil database
    console.log(data)
    if (error !== null) {
        return res.status(500).send('server error');
    }
    // data input dan data database apakah sama
    const {user, message} = cek(data, dataUser);
    if (user === null){
        return res.status(404).send(message);
    }
    //jika iya maka buat token
    const {token, err} = buatToken(user, SECRET_KEY);
    if(err !== null) {
        console.log(err);
        return res.status(500).send('server error')
    }
    //set token
    res.setHeader('auth', token);
    console.log(token)
    res.send(message);
})

app.get('/teachers', autentikasi, async (req, res) => {
    //cek user ketika loagin
    const {userTersebut} = req.user
    console.log(userTersebut);
    //ambil db guru
    const {data, err} = await getData(teachers)
    res.send(data);
});


app.listen(PORT, () => {
    console.log(`aplikasi berjalan pada localhost${PORT}`)
})

