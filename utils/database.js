const mysql = require("mysql");

const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "",
  database: "interrogazioni_orizzontali",
});

db.connect((err) => {
  if (err) {
    console.error("Errore durante la connessione al database:", err);
    return;
  }
  console.log("Connessione al database avvenuta con successo!");
});

module.exports = { db };
