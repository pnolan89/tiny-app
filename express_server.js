const express = require("express");
const app = express();
const bodyParser = require("body-parser");
const cookieSession = require("cookie-session");
const bcrypt = require('bcrypt');
const methodOverride = require('method-override');
const PORT = 8080;

app.set("view engine", "ejs");
app.use(express.static('public'));
app.use(bodyParser.urlencoded({extended: true}));
app.use(methodOverride('_method'));
app.use(cookieSession({
  name: 'session',
  keys: ["20", "dfasd"]
}));

const today = new Date();
const dateOptions = {timeZone: 'America/Ensenada', weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'};
const currentDate = today.toLocaleString("en-US", dateOptions);


const generateRandomString = () => {
  return Math.random().toString(36).substring(2, 8);
};

// Generates and adds a new short URL with properties to the database. Returns the link's ID.
const generateShortURL = (longURL, user_id) => {
  let shortURL = generateRandomString();
  urlDatabase[shortURL] = {
    shortURL: shortURL,
    longURL: longURL,
    user_id: user_id,
    date: currentDate,
    clicks: 0,
    uniqueClicks: [],
    visits: {}
  };
  return shortURL;
};

//Finds and returns any links owned by current user
const urlsForUser = (id) => {
  let userURLs = {};
  for (let url in urlDatabase) {
    if (urlDatabase[url].user_id === id) {
      userURLs[url] = urlDatabase[url];
    }
  }
  return userURLs;
};

//Standardizes URL format, in case users don't type 'http://' or 'www'
const formalizeURL = (id) => {
  let longURL = urlDatabase[id].longURL;
  longURL = longURL.replace("http://", "");
  longURL = longURL.replace("www.", "");
  return `http://www.${longURL}`;
};

//Checks whether a logged-in user has clicked a link, to add to the link's "Unique clicks" counter
const checkUniqueClick = (id, user_id) => {
  let uniqueClicks = urlDatabase[id].uniqueClicks;
  if (uniqueClicks.length === 0) {
    urlDatabase[id].uniqueClicks.push(user_id);
  } else {
    let counter = 0;
    uniqueClicks.forEach(click => {
      if (click !== user_id) {
        counter += 1;
      }
      if (counter === uniqueClicks.length) {
        urlDatabase[id].uniqueClicks.push(user_id);
      }
    });
  }
};

//Adds a visitor ID and timestamp to a URL when its short link is clicked.
const addVistorTimestamp = (id, user_id) => {
  let visitList = urlDatabase[id].visits;
  let visit_id = generateRandomString();
  visitList[visit_id] = {name: user_id, date: currentDate};
};

const urlDatabase = {
  "b2xVn2": {
    shortURL: "b2xVn2",
    longURL: "http://www.lighthouselabs.ca",
    user_id: "pnolan89",
    date: "Friday, January 18, 2019",
    clicks: 5,
    uniqueClicks: ['pnolan89'],
    visits: {}
    },
  "9sm5xK": {
    shortURL: "9sm5xK",
    longURL: "http://www.google.com",
    user_id: "pnolan89",
    date: "Thursday, January 17, 2019",
    clicks: 3,
    uniqueClicks: ['pnolan89', '123'],
    visits: {}
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
  if (req.session.user_id) {
    res.redirect("/urls");
  }
  let templateVars = {user: users[req.session.user_id]};
  res.render("login", templateVars);
});

app.put("/login", (req, res) => {
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
  if (req.session.user_id) {
    res.redirect("/urls");
  }
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
  if (req.session.user_id === false) {
    res.send("You are not logged in! Only logged-in users can create new links.");
  }
  res.redirect(`/urls/${generateShortURL(req.body.longURL, req.session.user_id)}`);
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
    res.send("You do not own this URL! Only the creator of this link can view its details. (Error code: 403)");
  }
  let templateVars = {
    shortURL: req.params.id,
    longURL: URL_id.longURL,
    user: users[req.session.user_id],
    date: URL_id.date,
    clicks: URL_id.clicks,
    uniqueClicks: URL_id.uniqueClicks.length,
    visits: URL_id.visits
  };
  res.render("urls_show", templateVars);
});

app.put("/urls/:id", (req, res) => {
  let shortURL = req.params.id;
  urlDatabase[shortURL].longURL = req.body.url;
  res.redirect(`/urls/`);
});

app.delete("/urls/:id/delete", (req, res) => {
  if (req.session.user_id === false) {
    res.send("You are not logged in! Only logged-in users can delete links.");
  }
  if (urlDatabase[req.params.id].user_id === req.session.user_id) {
    delete urlDatabase[req.params.id];
    res.redirect("/urls/");
  } else {
    res.send("You do not own this URL!");
  }
});

app.get("/u/:id", (req, res) => {
  if (urlDatabase[req.params.id] === undefined) {
    res.send("Cannot find that short URL! (Error code: 404)");
  }
  if (urlDatabase[req.params.id].longURL === "") {
    res.send("There doesn't seem to be a full URL assigned to this short link! (Error code: 404)");
  }
  res.redirect(formalizeURL(req.params.id));
  urlDatabase[req.params.id].clicks += 1;
  checkUniqueClick(req.params.id, req.session.user_id);
  addVistorTimestamp(req.params.id, req.session.user_id);
});

app.listen(PORT, () => {
  console.log(`Server listening on port ${PORT}!`);
});


