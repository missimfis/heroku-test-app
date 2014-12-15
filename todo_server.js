#!/usr/bin/env node --harmony
'use strict';
const
  express = require('express'),
  exphbs  = require('express-handlebars'),
  bodyParser = require('body-parser'),
  morgan = require('morgan'),
  session = require('express-session'),
  app = express();


app.use(morgan('dev'));

// REGISTER Handlebars as template engine
app.engine('handlebars', exphbs({defaultLayout: 'main'}));
app.set('view engine', 'handlebars');

// BEGIN AUTHENTICATION
var passport = require('passport')
  , LocalStrategy = require('passport-local').Strategy;

app.use(session({
  secret: 'impossible to predict'
}));
app.use(passport.initialize());
app.use(passport.session());

var User = function(username) {
  this.username = username;
}

passport.serializeUser(function(user, done) {
  done(null, user);
});

passport.deserializeUser(function(user, done) {
  done(null, user);
});

passport.use(new LocalStrategy(
  function(username, password, done) {
    if(username == "zhaw" && password == "secret") {
      var user = new User(username);
      console.log("authenticated");
      return done(null, user);
    }
    else {
      return done(null, false, { message: 'Incorrect username or password.' });
    }
  })
);

// Custom middleware to authenticate custom routes
function authed(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  } else {
    res.redirect(403, '/login.html');
  }
}

app.get('/login',
  passport.authenticate('local', { successRedirect: '/',
                                   failureRedirect: '/login.html'
                                 })
);
// END AUTHENTICATION

app.use(express.static(__dirname + '/bower_components'));
app.use(express.static(__dirname + '/static_html'));
// parse application/x-www-form-urlencoded
app.use(bodyParser.urlencoded({ extended: false }));

var todos = [];
var currentId = 1;

app.post('/todos', function(req, res) {
  var todo = {id: currentId, body: req.body.todo};
  currentId++;
  todos.push(todo);
  //res.status(200).json({'todo': todo});
  res.redirect('/')
});

app.get('/todos', authed, function(req, res) {
  res.status(200).json({'todos': todos});
});

app.get('/', authed, function(req, res) {
  res.render("home", { user: req.user, todos: todos });
});

app.get('/destroy/:id', authed, function(req, res, next) {

  var i, todoIndex = null;
  for(i=0; i < todos.length;i++) {
    if (todos[i].id == req.params.id) {
      todos.splice(i, 1);
      break;
    }
  }

  res.redirect('/');
});

app.get('/logout', authed, function(req, res) {
  req.logOut();
  res.redirect('/');
})

app.listen(process.env.PORT || 5000, function(){
  console.log("ready captain.");
});
