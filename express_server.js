const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

function generateRandomString() {
  return Math.random().toString(36).substring(2, 8);
}

const urlDatabase = {
  "b2xVn2": "http://www.lighthouselabs.ca",
  "9sm5xK": "http://www.google.com"
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "purple-monkey-dinosaur"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "dishwasher-funk"
  },
  "yabadaba": {
    id: "yabadaba",
    email: "aaaayyyyy@example.com",
    password: "funk"
  },
   "ramsaybolton": {
    id: "ramsaybolton",
    email: "holdsnosecrets.com",
    password: "dishwasher-reek"
  },
   "pnolan89": {
    id: "pnolan89",
    email: "pnolan@example.com",
    password: "123"
  },
};


app.get("/", (req, res) => {
  res.send("Hello!");
});

app.get("/login", (req, res) => {
  let templateVars = {user: users[req.cookies.userID]};
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  let counter = 0;
  for (let user in users) {
    if (users[user].email === req.body.email) {
      if (users[user].password === req.body.password) {
        res.cookie("userID", users[user].id);
        res.redirect("/urls");
      } else {
        res.send(`Incorrect password for ${req.body.email}! (Error 403)`);
      }
    } else {
      counter += 1;
      if (counter === Object.keys(users).length) {
        res.send("Email not found! (Error 403)");
      }
    }
  }
});

app.post("/logout", (req, res) => {
  res.clearCookie("userID");
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = {user: users[req.cookies.userID]};
  res.render("register", templateVars);
});

app.post("/register", (req, res) => {
  let email = req.body.email;
  let password = req.body.password;
  if (email === "" || password === "") {
    res.send("Please enter both an email and a password! (Error code: 400)");
  } else {
    for (let user in users) {
      if (users[user].email === email) {
      res.send("Email already registered! (Error code: 400)");
      return;
      }
    }
    let userID = generateRandomString();
    users[userID] = {
      id: userID,
      email: email,
      password: password
    };
    res.cookie("userID", userID);
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlDatabase,
    user: users[req.cookies.userID]
  };
  res.render("urls_index", templateVars);
});

app.get("/urls/new", (req, res) => {
  let templateVars = {
    user: users[req.cookies.userID]
  };
  res.render("urls_new", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = req.body.longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/:id", (req, res) => {
  let templateVars = {
    shortURL: req.params.id,
    longURL: urlDatabase[req.params.id],
    user: users[req.cookies.userID]
  };
  res.render("urls_show", templateVars);
});

app.post("/urls/:id", (req, res) => {
  let longURL = req.body.url;
  let shortURL = req.params.id;
  urlDatabase[shortURL] = longURL;
  res.redirect(`/urls/${shortURL}`);
});

app.post("/urls/:id/delete", (req, res) => {
  delete urlDatabase[req.params.id];
  res.redirect("/urls/");
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  let longURL = urlDatabase[req.params.id];
  longURL = longURL.replace("http://", "");
  longURL = longURL.replace("www.", "");
  res.redirect(`http://www.${longURL}`);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});