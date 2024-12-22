const express = require("express");
const app = express();
const mysql = require("mysql");
const cors = require("cors");
const zxcvbn = require("zxcvbn");
const { Translate } = require("@google-cloud/translate").v2;
const PORT = 3001;

const { encrypt, decrypt } = require("./pswrd_encrypt");

const translate = new Translate();

// Funkcja tłumaczenia na polski
async function translateToPolish(text) {
  try {
    const [translation] = await translate.translate(text, 'pl');
    return translation;
  } catch (error) {
    console.error("Błąd tłumaczenia:", error);
    return text; // Jeśli wystąpi błąd, zwróć oryginalny tekst
  }
}

app.use(cors());
app.use(express.json());

// Dodawanie hasła
app.post("/addpassword", async (req, res) => {
  const { password, title } = req.body;

  // Sprawdzanie siły hasła
  const passwordStrength = zxcvbn(password);
  const score = passwordStrength.score; // 0-4, gdzie 4 to najbezpieczniejsze

  if (score < 1) {
    const warningMessage = "Hasło jest zbyt słabe.";
    const translatedMessage = await translateToPolish(warningMessage);
    return res.status(400).send({ message: translatedMessage });
  }

  const hashedPassword = encrypt(password);

  db.query(
    "INSERT INTO passwords (password, title, iv) VALUES(?, ?, ?)", 
    [hashedPassword.password, title, hashedPassword.iv],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Błąd serwera podczas dodawania hasła.");
      } else {
        res.send({ id: result.insertId, iv: hashedPassword.iv });
      }
    }
  );
});

// Funkcja do generowania losowego hasła
const generateRandomPassword = (length = 12) => {
  const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*()_+";
  let password = "";
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
};

// Endpoint do generowania losowego hasła
app.get("/generatepassword", (req, res) => {
  const length = parseInt(req.query.length) || 12;
  const password = generateRandomPassword(length);
  res.send({ password });
});

// Wyświetlanie haseł
app.get("/showpasswords", (req, res) => {
  db.query("SELECT * FROM passwords;", 
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Błąd serwera podczas pobierania haseł.");
      } else {
        res.send(result);
      }
    }
  );
});

// Odszyfrowywanie hasła
app.post("/decryptpassword", (req, res) => {
  res.send(decrypt(req.body));
});

// Usuwanie hasła
app.delete("/deletepassword/:id", (req, res) => {
  const { id } = req.params;

  db.query(
    "DELETE FROM passwords WHERE id = ?",
    [id],
    (err, result) => {
      if (err) {
        console.log(err);
        res.status(500).send("Błąd serwera podczas usuwania hasła.");
      } else if (result.affectedRows === 0) {
        res.status(404).send("Nie znaleziono hasła o podanym ID.");
      } else {
        res.send("Hasło zostało pomyślnie usunięte.");
      }
    }
  );
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
