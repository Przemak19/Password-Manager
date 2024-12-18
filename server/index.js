const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");
const PORT = 3001;

const {encrypt, decrypt} = require("./pswrd_encrypt")

app.use(cors());
app.use(express.json());

app.post("/addpassword", (req, res) => {
  const {password, title} = req.body;
  const hashedPassword = encrypt(password);

  db.query("INSERT INTO passwords (password, title, iv) VALUES(?, ?, ?)", 
    [hashedPassword.password, title, hashedPassword.iv],
    (err, result) => {
        if(err) {
          console.log(err);
        } else {
          res.send("Success");
        }
    }
  );
});

app.get("/showpasswords", (req, res) => {
  db.query("SELECT * FROM passwords;", 
    (err, result) => {
      if(err) {
        console.log(err);
      } else {
        res.send(result);
      }
    });
});

app.post("/decryptpassword", (req, res) => {
  res.send(decrypt(req.body));
});

app.listen(PORT, () => {
  console.log(`Serwer działa na porcie ${PORT}`);
});

const db = mysql.createConnection({
    user: "root",
    host: "localhost",
    password: "root",
    database: "passwordmanager",
});

db.connect((err) => {
  if (err) {
    console.error("Nie można połączyć się z bazą danych:", err.message);
    return;
  }
  console.log("Połączono z bazą danych MySQL");
});