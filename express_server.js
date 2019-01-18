const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const PORT = 8080; // default port 8080

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieSession({
  name: 'session',
  keys: ["20", "dfasd"]
}));

const today = new Date();
const dateOptions = {timeZone: 'America/New_York', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
const currentDate = today.toLocaleString("en-US", dateOptions);


const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

const urlsForUser = (id) => {
  let userURLs = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].user_id === id) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};

const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    user_id: "pnolan89",
    date: "Friday, January 18, 2019",
    clicks: 5,
    uniqueClicks: ['pnolan89']
    },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    user_id: "pnolan89",
    date: "Friday, January 18, 2019",
    clicks: 3,
    uniqueClicks: ['pnolan89', '123']
    }
};

const users = {
  "userRandomID": {
    id: "userRandomID",
    email: "user@example.com",
    password: "$2b$10$t4Z31raT82PHFEXsjbnU/eeZqNjNHYO7yYyS3WsWE88tGY8Y48sHy"
  },
 "user2RandomID": {
    id: "user2RandomID",
    email: "user2@example.com",
    password: "$2b$10$VrOXt20iPG8F1H6MWdgPjO3ht6t/aSe9uX.rOHliajwvL6nNhJC5W"
  },
  "yabadaba": {
    id: "yabadaba",
    email: "aaaayyyyy@example.com",
    password: "$2b$10$mZdcUHncA3S8YXHQV9bpQOdfC8plHFld1Qhz/XM.0Hm3xh/XQdjpC"
  },
   "ramsaybolton": {
    id: "ramsaybolton",
    email: "holdsnosecrets.com",
    password: "$2b$10$nT2vdphMX2m6Rhb.dfmMzepGA.hwWm8RlHD5kTQby7FwqpHt.IHBC"
  },
   "pnolan89": {
    id: "pnolan89",
    email: "pnolan@example.com",
    password: "$2b$10$XQw09CW8vxeuHMs2ymVBs.ekEkgNsuSpKkb0ljBDmBbysBXxEFloa"
  },
    "123": {
    id: "123",
    email: "123@123",
    password: "$2b$10$XQw09CW8vxeuHMs2ymVBs.ekEkgNsuSpKkb0ljBDmBbysBXxEFloa"
  },
};

app.get("/", (req, res) => {
  if (req.session.user_id) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/login", (req, res) => {
  let templateVars = {user: users[req.session.user_id]};
  res.render("login", templateVars);
});

app.post("/login", (req, res) => {
  let counter = 0;
  for (let user in users) {
    if (users[user].email === req.body.email) {
      if (bcrypt.compareSync(req.body.password, users[user].password)) {
        req.session.user_id = users[user].id;
        res.redirect("/urls");
      } else {
        res.send(`Incorrect password for ${req.body.email}! (Error code: 403)`);
      }
    } else {
      counter += 1;
      if (counter === Object.keys(users).length) {
        res.send("Email not found! (Error code: 403)");
      }
    }
  }
});

app.post("/logout", (req, res) => {
  req.session = null;
  res.redirect("/urls");
});

app.get("/register", (req, res) => {
  let templateVars = {user: users[req.session.user_id]};
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
    let user_id = generateRandomString();
    let hashedPassword = bcrypt.hashSync(password, 10);
    users[user_id] = {
      id: user_id,
      email: email,
      password: hashedPassword
    };
    req.session.user_id = user_id;
    res.redirect("/urls");
  }
});

app.get("/urls", (req, res) => {
  let templateVars = {
    urls: urlsForUser(req.session.user_id),
    user: users[req.session.user_id]
  };
  res.render("urls_index", templateVars);
});

app.post("/urls", (req, res) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: req.body.longURL,
    user_id: req.session.user_id,
    date: currentDate,
    clicks: 0,
    uniqueClicks: []
  };
  res.redirect(`/urls/${shortURL}`);
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      user: users[req.session.user_id]
    };
    res.render("urls_new", templateVars);
  } else {
    res.redirect("/urls");
  }
});

app.get("/urls/:id", (req, res) => {
  let URL_id = urlDatabase[req.params.id];
  if (URL_id === undefined) {
    res.send("Cannot find that short URL! (Error code: 404)");
  }
  if (req.session.user_id === undefined) {
    res.send("You are not logged in! Only the creator of this link can view its details. (Error code: 403)");
  }
  if (req.session.user_id !== URL_id.user_id) {
    res.send("You do not own this URL! Only the creator of this link can view its details. (Error code: 403)")
  }
  let templateVars = {
    shortURL: req.params.id,
    longURL: URL_id.longURL,
    user: users[req.session.user_id],
    date: URL_id.date,
    clicks: URL_id.clicks,
    uniqueClicks: URL_id.uniqueClicks.length
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
  if (urlDatabase[req.params.id].user_id === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls/");
  } else {
    res.send("You do not own this URL!");
  }
});

app.get("/urls.json", (req, res) => {
  res.json(urlDatabase);
});

app.get("/u/:id", (req, res) => {
  let URL_id = urlDatabase[req.params.id];
  if (URL_id === undefined) {
    res.send("Cannot find that short URL! (Error code: 404)");
  }
  let longURL = urlDatabase[req.params.id].longURL;
  longURL = longURL.replace("http://", "");
  longURL = longURL.replace("www.", "");
  res.redirect(`http://www.${longURL}`);
  urlDatabase[req.params.id].clicks += 1;
  let uniqueClicks = urlDatabase[req.params.id].uniqueClicks;
  if (uniqueClicks.length === 0) {
    urlDatabase[req.params.id].uniqueClicks.push(req.session.user_id);
  } else {
    console.log(uniqueClicks[0]);
    let counter = 0;
    uniqueClicks.forEach(click => {
      if (click !== req.session.user_id) {
        counter += 1;
      }
      if (counter === uniqueClicks.length) {
        urlDatabase[req.params.id].uniqueClicks.push(req.session.user_id);
      }
    });
  }
  // console.log(req.session.user_id);
  // console.log(urlDatabase[req.params.id].uniqueClicks);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});


