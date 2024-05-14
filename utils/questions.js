const mysql = require("mysql");
const { db } = require("./database");

// Funzione per ottenere una domanda casuale dal database
function getDomandaCasuale(callback) {
  const query = `SELECT * FROM domanda ORDER BY RAND() LIMIT 1`;
  db.query(query, (err, result) => {
    if (err) {
      console.error("Errore durante il recupero della domanda casuale:", err);
      callback(err, null);
    } else {
      const domandaCasuale = result[0];
      callback(null, domandaCasuale);
    }
  });
}

// Funzione per avviare un'interrogazione
function avviaInterrogazione(durataGiorni, dataInizio, callback) {
  const queryInterrogazione = `INSERT INTO interrogazione (Durata_Giorni, Data_Inizio) VALUES (?, ?)`;
  db.query(queryInterrogazione, [durataGiorni, dataInizio], (err, result) => {
    if (err) {
      callback(err, null);
    } else {
      const interrogazioneId = result.insertId;
      callback(null, interrogazioneId);
    }
  });
}

// Funzione per ottenere la domanda successiva
function domandaSuccessiva(idInterrogazione, callback) {
  const query = `SELECT * FROM domanda WHERE ID_domanda NOT IN (SELECT ID_domanda FROM interrogazione_domanda WHERE ID_interrogazione = ?) ORDER BY RAND() LIMIT 1`;
  db.query(query, [idInterrogazione], (err, result) => {
    if (err) {
      console.error(
        "Errore durante il recupero della domanda successiva:",
        err
      );
      callback(err, null);
    } else {
      const domandaSuccessiva = result[0];
      callback(null, domandaSuccessiva);
    }
  });
}

// Funzione per salvare il voto dello studente e ottenere una nuova domanda e un nuovo studente
function studenteSuccessivo(idInterrogazione, idStudente, voto, callback) {
  // Implementazione della funzione...
}

module.exports = {
  getDomandaCasuale,
  avviaInterrogazione,
  domandaSuccessiva,
  studenteSuccessivo,
};
