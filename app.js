const express = require('express');
var mongoose = require('mongoose');
const session =  require('express-session');
const path = require('path');
const expressHandleBars = require('express-handlebars');
const body = require('body-parser');
const MongoStore = require('connect-mongo')(session);
const app = express();

app.set("views", path.join(__dirname,"/views/"))
app.engine("hbs", expressHandleBars({
    extname: "hbs",
    defaultLayout: "mainLayout",
    layoutsDir: __dirname + "/views/layouts"
}));
app.set("view engine", "hbs");

app.use(body.urlencoded({
    extended:true
}
));

const TWO_HOURS = 1000*60*10;

const {
    PORT = 3000,
    SESS_LIFETIME = TWO_HOURS,
    SESS_NAME = "sid",
    Sess_Secret= "ssh!queueMicrotask.it\asecret!"
} = process.env

const users = [
    {id: 1, name : "Alex",email: "alex@gmail.com",password: "secret"},
    {id: 2, name : "Max",email: "alex1@gmail.com",password: "secret"},
    {id: 3, name : "John",email: "alex2@gmail.com",password: "secret"},
    {id: 4, name : "Harry",email: "alex3@gmail.com",password: "secret"},
    {id: 5, name : "Stuart",email: "alex4@gmail.com",password: "secret"}
];

app.use(session({
    name:SESS_NAME,
    resave: false,
    saveUninitialized:false,
    secret: Sess_Secret,
    store: new MongoStore({url: 'mongodb://localhost:27017/Store',
    autoRemove: 'interval',
    autoRemoveInterval: 10}),
    cookie: {
        maxAge:SESS_LIFETIME,
        sameSite:true,
    }
}));


const redirectLogin = (req, res, next)=>{
    if(!req.session.userId){
        res.redirect('/login')
    }else{
        next()
    }
};
const redirectHome = (req, res, next)=>{
    if(req.session.userId){
        res.redirect('/dashboard')
    }else{
        next()
    }
};

app.get('/', (req, res)=>{
    const {userId} = req.session;
    console.log(req.sessionID);
    res.send(`
    <h1>Welcome</h1>
    ${userId ? `<a href="/dashboard">HOME</a>
    <form method="post" action="/logout">
    <button>LogOut</button>
    </form>` : `
    <a href="/login">Login</a>
    <a href="/register">Register</a>
    `}
    `);
});
app.get('/dashboard',redirectLogin, (req, res)=>{

    const user = users.find(user => user.id===req.session.userId)
    res.send(`
    <h1>Home</h1>
    <a href='/'>Main</a>
    <ul>
    <li>Name: ${user.name}</li>
    <li>Email: ${user.email} </li>
    <li>Password:.3 ${user.password}</li>
    </ul>
    `)    
});

app.get('/login',redirectHome, (req, res)=>{
    /*res.send(`
    <h1>Login</h1>
    <form method="post" action="/login">
        <input type='email' name='email' placeholder='Email' required />
        <input type='password' name='password' placeholder='Password' required />
        <input type='submit'/>
    </form>
    <a href="/register">Register</a>
    `);*/
    res.render("login");
});
app.get('/register',redirectHome, (req, res)=>{
    /*res.send(`
    <h1>Register</h1>
   25<form method="post" action="/register">
    <input name='name' placeholder='Name' required />
        <input type='email' name='email' placeholder='Email' required />
        <input type='password' name='password' placeholder='Password' required />
        <input type='submit'/>
    </form>
    <a href="/login">Login</a>
    `);*/
    res.render("register");
    
});

app.post('/login',redirectHome, (req, res)=>{
    const email = req.body.email;
    const password = req.body.password;
    console.log(req.body.email)
    if(email && password){
        const user = users.find(
            user=> user.email===email && user.password===password
        )
    if(user){
        req.session.userId = user.id
        return res.redirect("/dashboard");
    }
}
    res.redirect("/login")

});

app.post('/register',redirectHome, (req, res)=>{
    const name = req.body.name;
    const email = req.body.email;
    const password = req.body.password;
    if(name && email && password){
        const exists = users.some(
            user => users.email===email
        )

        if(!exists){
            const user =  {
                id: users.length+1,
                name,
                email,
                password
            }
            users.push(user);
            req.session.userId = user.id;
            return res.redirect("/login");
        }
    }
    res.redirect("/register");
    
});

app.post('/logout',redirectLogin,(req, res)=>{
    req.session.destroy((error)=>{
        console.log(error);
    })
    res.clearCookie(SESS_NAME)
    res.redirect("/login")
});

app.listen(PORT, () => console.log(
    `http://localhost:${PORT}`));
