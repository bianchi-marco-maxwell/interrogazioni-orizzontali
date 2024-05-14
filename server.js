const {
  autenticazioneDocente,
  registrazioneDocente,
} = require("./utils/authentication");
const {
  getDomandaCasuale,
  avviaInterrogazione,
  domandaSuccessiva,
  studenteSuccessivo,
} = require("./utils/questions");
const { db } = require("./utils/database");
const fs = require("fs");
const express = require("express");
const bodyParser = require("body-parser");
const cookieParser = require("cookie-parser");
const mysql = require("mysql");
const path = require("path");
const expressWs = require("express-ws");
const server = express();
server.use(cookieParser());
server.use(bodyParser.json());
server.use(bodyParser.urlencoded({ extended: true }));
const clients = {};
const richiesteMaterie = {};
fs.readFile("studenti.csv", "utf8", (err, data) => {
  if (err) {
    console.error("Errore nella lettura del file:", err);
    return;
  }

  // Separazione delle righe del CSV
  const rows = data
    .trim()
    .split("\n")
    .map((row) => row.trim());

  // Rimuovi l'intestazione se presente
  const header = rows.shift();

  // Itera sulle righe e inserisci i dati nel database
  rows.forEach((row, index) => {
    const [Nome, Cognome, Classe] = row.split(",");
    const studente = { Nome, Cognome, Classe };

    // Query per l'inserimento dello studente nel database
    const query =
      "INSERT INTO studente (Nome, Cognome, Classe) VALUES (?, ?, ?)";
    db.query(
      query,
      [studente.Nome, studente.Cognome, studente.Classe],
      (err, result) => {
        if (err) {
          console.error(
            `Errore durante l'inserimento dello studente alla riga ${
              index + 1
            }:`,
            err
          );
        } else {
          console.log(`Studente alla riga ${index + 1} inserito con successo`);
        }
      }
    );
  });
});

server.post("/studenteSuccessivo", (req, res) => {
  const { idInterrogazione, idStudente, voto } = req.body;
  studenteSuccessivo(
    idInterrogazione,
    idStudente,
    voto,
    (err, nuovaDomanda, nuovoStudente) => {
      if (err) {
        console.error(
          "Errore durante il recupero della nuova domanda e dello studente:",
          err
        );
        res
          .status(500)
          .send(
            "Errore durante il recupero della nuova domanda e dello studente"
          );
      } else {
        res.status(200).json({ nuovaDomanda, nuovoStudente });
      }
    }
  );
});

server.post("/insDomande", (req, res) => {
  const { testo, materia, macroargomento, tag } = req.body;
  const query = `INSERT INTO domanda (Testo, Materia, Macroargomento, Tag) VALUES (?, ?, ?, ?)`;
  db.query(query, [testo, materia, macroargomento, tag], (err, result) => {
    if (err) {
      console.error("Errore durante l'aggiunta della nuova domanda:", err);
      res.status(500).send("Errore durante l'aggiunta della nuova domanda");
    } else {
      res.redirect("/home");
    }
  });
});

server.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "login.html"));
}); /*
server.post("/insDomande", (req, res) => {
  const { testo, materia, macroargomento, tag } = req.body;
  // Query SQL per l'inserimento dei dati nella tabella domanda
  const sql =
    "INSERT INTO domanda (Testo, Materia, Macroargomento, Tag) VALUES (?, ?, ?, ?)";
  // Esecuzione della query con i dati ricevuti dal body della richiesta
  db.query(sql, [testo, materia, macroargomento, tag], (err, result) => {
    if (err) {
      console.error("Errore durante l'inserimento della domanda:", err);
      res.status(500).send("Errore durante l'inserimento della domanda");
      return;
    }
    console.log("Domanda inserita con successo:");
    res.status(200).send("Domanda inserita con successo");
  });
});*/
server.get("/insDomande", (req, res) => {
  res.sendFile(path.join(__dirname, "insDomande.html"));
});

expressWs(server);
server.post("/login", (req, res) => {
  const { username, password } = req.body;
  autenticazioneDocente(username, password, (err, successo) => {
    if (err) {
      res.status(500).json({ error: "Errore durante l'autenticazione" });
    } else {
      if (successo) {
        // Dopo l'autenticazione, crea e invia il cookie di autenticazione
        res.cookie("authenticationCookie", "yourCookieValueHere", {
          httpOnly: true,
        });
        res.status(200).json({ redirect: "/home" });
      } else {
        res.status(401).json({ error: "Credenziali non valide" });
      }
    }
  });
});
server.get("/sorteggio", (req, res) => {
  res.sendFile(path.join(__dirname, "sorteggio.html"));
});
server.get("/home", (req, res) => {
  // Qui potresti controllare la presenza del cookie di autenticazione
  // e reindirizzare l'utente a index.html solo se il cookie è presente
  const authenticationCookie = req.cookies.authenticationCookie;
  if (!authenticationCookie) {
    return res.redirect("/"); // Reindirizza l'utente al login se il cookie non è presente
  }
  res.sendFile(path.join(__dirname, "index.html"));
});
// Endpoint per gestire la registrazione
server.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  // Controllo se i dati sono validi
  if (!username || !email || !password) {
    return res
      .status(400)
      .json({ error: "Username, email e password sono campi obbligatori" });
  }

  registrazioneDocente(username, email, password, (err, docenteId) => {
    if (err) {
      res.status(500).json({ error: "Errore durante la registrazione" });
    } else {
      res.status(200).json({ message: "Registrazione avvenuta con successo" });
    }
  });
});

// Gestione dei messaggi WebSocket
server.ws("/", function (ws, req) {
  console.log("ws connection");
  const clientId = Date.now().toString();
  clients[clientId] = ws;
  ws.on("message", function (msg) {
    const data = JSON.parse(msg);
    console.log(data.type);

    if (data.type === "login_docente") {
      const { username, password } = data;
      autenticazioneDocente(username, password, (err, successo) => {
        if (err) {
          ws.send(
            JSON.stringify({
              type: "login_error",
              message: "Errore durante l'autenticazione",
            })
          );
        } else {
          if (successo) {
            ws.send(
              JSON.stringify({
                type: "login_success",
                message: "Login avvenuto con successo",
              })
            );
          } else {
            ws.send(
              JSON.stringify({
                type: "login_error",
                message: "Credenziali non valide",
              })
            );
          }
        }
      });
    }

    if (data.type === "registrazione_docente") {
      const { nome, cognome, email, password } = data;
      registrazioneDocente(nome, cognome, email, password, (err, docenteId) => {
        if (err) {
          ws.send(
            JSON.stringify({
              type: "registrazione_error",
              message: "Errore durante la registrazione",
            })
          );
        } else {
          ws.send(
            JSON.stringify({
              type: "registrazione_success",
              message: "Registrazione avvenuta con successo",
            })
          );
        }
      });
    }
    if (data.type === "materia_selezionata") {
      const materiaSelezionata = data.materia;
      // Memorizza la richiesta di materia per questo client
      richiesteMaterie[clientId] = materiaSelezionata;
      // Esegui la query per ottenere tutte le domande della materia selezionata
      db.query(
        "SELECT * FROM domanda WHERE Materia = ?",
        materiaSelezionata,
        (err, domande) => {
          if (err) {
            console.error("Errore durante il recupero delle domande:", err);
          } else {
            // Invia le domande solo al client che ha fatto la richiesta
            ws.send(JSON.stringify({ type: "domande", domande: domande }));
          }
        }
      );
    }
    function inserisciValutazione(id, voto, data) {
      const query =
        "INSERT INTO interrogazioni (Id_studente, Voto, Data) VALUES (?, ?, ?)";
      db.query(query, [id, voto, data], (error, results, fields) => {
        if (error) {
          console.error(
            'Errore durante l\'inserimento nella tabella "interrogazioni":',
            error
          );
          return;
        }
        console.log(
          'Nuova valutazione inserita con successo nella tabella "interrogazioni".'
        );
      });
    }

    // Quando viene ricevuto un messaggio di tipo "valutazione" dal client
    if (data.type === "valutazione") {
      inserisciValutazione(data.id, data.voto, data.data);
    }
    if (data.type === "materia_selezionata2") {
      const materiaSelezionata = data.materia;
      // Memorizza la richiesta di materia per questo client
      richiesteMaterie[clientId] = materiaSelezionata;
      // Esegui la query per ottenere tutte le classi disponibili dal database
      db.query("SELECT DISTINCT Classe FROM studente", (err, result) => {
        if (err) {
          console.error("Errore durante il recupero delle classi:", err);
        } else {
          const classi = result.map((row) => row.Classe);
          // Invia le classi solo al client che ha fatto la richiesta
          ws.send(JSON.stringify({ type: "elenco_classi", classi: classi }));
        }
      });
    }
    if (data.type === "classe_selezionata") {
      console.log("Selezionata");
      const classeSelezionata = data.classe;
      // Esegui la query per ottenere tutti gli studenti della classe selezionata
      db.query(
        "SELECT * FROM studente WHERE classe = ?",
        classeSelezionata,
        (err, studenti) => {
          if (err) {
            console.error("Errore durante il recupero degli studenti:", err);
          } else {
            // Invia gli studenti e le domande solo al client che ha fatto la richiesta
            ws.send(JSON.stringify({ type: "studenti", studenti: studenti }));
          }
        }
      );
    }
  });
  ws.on("close", function () {
    delete clients[clientId];
    delete richiesteMaterie[clientId];
  });
});

server.listen(3000);
