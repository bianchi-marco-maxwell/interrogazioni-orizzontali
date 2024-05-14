const { db } = require("./database");

// Funzione per l'autenticazione del docente
function autenticazioneDocente(username, password, callback) {
  const query = `SELECT * FROM professore WHERE Mail = ? AND Password = ?`;
  db.query(query, [username, password], (err, result) => {
    if (err) {
      callback(err, null);
    } else {
      if (result.length > 0) {
        callback(null, true);
      } else {
        callback(null, false);
      }
    }
  });
}

// Funzione per la registrazione del docente
function registrazioneDocente(nome, email, password, callback) {
  const query = `INSERT INTO professore (Nome, Mail, Password) VALUES (?, ?, ?)`;
  db.query(query, [nome, email, password], (err, result) => {
    if (err) {
      callback(err, null);
    } else {
      callback(null, result.insertId);
    }
  });
}

module.exports = { autenticazioneDocente, registrazioneDocente };
