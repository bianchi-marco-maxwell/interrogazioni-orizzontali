const mysql = require("mysql");
const { db } = require("./database");
const { domandaSuccessiva, getDomandaCasuale } = require("./questions");

// Funzione per salvare il voto dello studente e ottenere una nuova domanda e un nuovo studente
function studenteSuccessivo(idInterrogazione, idStudente, voto, callback) {
  // Salva il voto dello studente nella tabella interrogazione_studente
  const query = `INSERT INTO interrogazione_studente (Voto_temporaneo, ID_interrogazione, ID_studente) VALUES (?, ?, ?)`;
  db.query(query, [voto, idInterrogazione, idStudente], (err, result) => {
    if (err) {
      callback(err, null, null);
    } else {
      // Ottenere la domanda successiva
      domandaSuccessiva(idInterrogazione, (err, nuovaDomanda) => {
        if (err) {
          callback(err, null, null);
        } else {
          // Ottenere un nuovo studente
          getStudenteCasuale((err, nuovoStudente) => {
            if (err) {
              callback(err, null, null);
            } else {
              callback(null, nuovaDomanda, nuovoStudente);
            }
          });
        }
      });
    }
  });
}

module.exports = { studenteSuccessivo };
