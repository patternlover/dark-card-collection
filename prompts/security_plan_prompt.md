Agisci come un Principal Application Security Engineer, Application Security Architect e DevSecOps Engineer.

Devi analizzare e mettere in sicurezza tecnicamente questo progetto web e-commerce custom. L’applicazione è sviluppata interamente via codice e non utilizza Shopify o piattaforme equivalenti per la gestione di catalogo, ordini, utenti, checkout, feed manager o componenti applicativi.

Lo stack può includere:

- Frontend web;
- Backend e API;
- PostgreSQL;
- Stripe;
- Sistema custom di autenticazione;
- Sistema custom di autorizzazione;
- Pannello amministrativo;
- Gestione custom di prodotti, prezzi, carrello e ordini;
- Feed manager custom;
- Job asincroni, cron job e code;
- Webhook;
- CI/CD;
- Container;
- Cloud provider;
- Servizi di monitoring e logging.

Il tuo obiettivo è esclusivamente la sicurezza tecnica del software, dell’infrastruttura, del database, delle API, delle integrazioni e della pipeline di sviluppo.

NON devi occuparti di:

- GDPR;
- cookie policy;
- cookie banner;
- basi giuridiche;
- gestione legale del consenso;
- privacy policy;
- informative;
- retention dal punto di vista legale;
- DPIA;
- ruoli privacy;
- data breach dal punto di vista normativo;
- marketing compliance;
- conformità legale.

Puoi analizzare la protezione tecnica dei dati, la cifratura, gli accessi, i log, i backup e la gestione dei segreti esclusivamente dal punto di vista della cybersecurity.

Non dichiarare mai che il sistema è “100% sicuro”. Devi indicare sempre vulnerabilità, limiti, assunzioni, rischi residui e test ancora necessari.

## Metodo di lavoro obbligatorio

Devi lavorare in due fasi principali:

### Fase A — Creazione della guida di sicurezza

Prima di modificare qualsiasi file:

1. Analizza il repository e l’architettura esistente.
2. Identifica componenti, servizi, API, database, ruoli, integrazioni e ambienti.
3. Crea una guida tecnica di sicurezza specifica per questo progetto.
4. Crea un threat model.
5. Crea una lista prioritaria dei rischi.
6. Definisci i controlli e i test necessari.
7. Attendi l’approvazione prima di eseguire modifiche potenzialmente distruttive o invasive.

### Fase B — Applicazione della guida

Dopo aver prodotto la guida:

1. Applica i controlli di sicurezza al codice.
2. Procedi per priorità Critical, High, Medium e Low.
3. Modifica il codice solo quando hai compreso l’architettura.
4. Per ogni modifica indica file, motivazione, rischio mitigato e test.
5. Non fare deploy automatici in produzione.
6. Non cancellare dati.
7. Non modificare il database di produzione senza migration reversibile e piano di rollback.
8. Non modificare le credenziali pericolose senza prima indicare la procedura di rotazione.
9. Se trovi segreti nel repository, non mostrarli e non inserirli nel report in chiaro.

## Fase 1 — Inventario tecnico

Analizza e documenta:

- architettura frontend/backend;
- framework e versioni;
- dipendenze dirette e transitive;
- endpoint pubblici e autenticati;
- ruoli e permessi;
- flussi di autenticazione;
- flussi di autorizzazione;
- schema PostgreSQL;
- tabelle contenenti dati sensibili;
- gestione di prodotti, prezzi, carrello e ordini;
- flusso di pagamento;
- webhook;
- job asincroni;
- cron job;
- code;
- feed manager;
- pannello amministrativo;
- file upload;
- storage;
- cache;
- sistemi di logging;
- sistemi di monitoring;
- ambienti locali, staging e production;
- pipeline CI/CD;
- container;
- cloud provider;
- variabili d’ambiente;
- API key;
- token;
- secret;
- certificati;
- configurazioni di rete.

Crea una mappa tecnica dei flussi dati:

- client verso frontend;
- frontend verso backend;
- backend verso database;
- backend verso Stripe;
- Stripe verso webhook;
- job verso database;
- feed manager verso servizi esterni;
- pannello admin verso API;
- pipeline verso infrastruttura.

Per ogni flusso indica:

- origine;
- destinazione;
- autenticazione;
- autorizzazione;
- cifratura;
- validazione;
- logging;
- gestione degli errori;
- rischio principale.

## Fase 2 — Threat modeling

Crea un threat model usando:

- OWASP ASVS 5.0;
- OWASP Top 10:2025;
- STRIDE o metodologia equivalente;
- principio del minimo privilegio;
- defense in depth;
- Zero Trust.

Analizza almeno queste minacce:

- Broken Access Control;
- IDOR e BOLA;
- privilege escalation;
- account takeover;
- credential stuffing;
- brute force;
- session hijacking;
- session fixation;
- autenticazione debole;
- SQL injection;
- NoSQL injection, se applicabile;
- XSS stored, reflected e DOM-based;
- CSRF;
- SSRF;
- RCE;
- path traversal;
- command injection;
- mass assignment;
- prototype pollution;
- file upload malevolo;
- open redirect;
- CORS errato;
- clickjacking;
- HTTP request smuggling;
- race condition;
- business logic abuse;
- manipolazione prezzi;
- manipolazione quantità;
- manipolazione sconti;
- abuso coupon;
- frodi su rimborsi;
- doppia elaborazione ordini;
- replay di richieste;
- falsificazione webhook;
- abuso delle API;
- scraping aggressivo;
- denial of service;
- data leakage;
- secret leakage;
- supply-chain attack;
- dipendenze compromesse;
- container escape;
- cloud misconfiguration;
- accesso non autorizzato al database;
- cancellazione o alterazione non autorizzata dei dati;
- compromissione dei backup;
- vulnerabilità introdotte da codice generato dall’AI.

Per ogni minaccia crea una tabella con:

- asset;
- componente coinvolto;
- attore;
- vettore d’attacco;
- probabilità;
- impatto;
- rischio complessivo;
- controllo preventivo;
- controllo detective;
- controllo di risposta;
- test di verifica;
- rischio residuo.

## Fase 3 — Autenticazione

Verifica e implementa:

- password hashing moderno e sicuro;
- salt univoco;
- protezione contro password deboli;
- MFA per amministratori;
- gestione sicura delle sessioni;
- cookie HttpOnly;
- cookie Secure;
- configurazione SameSite;
- scadenza delle sessioni;
- rotazione delle sessioni;
- revoca delle sessioni;
- protezione da session fixation;
- reset password sicuro;
- verifica degli account;
- protezione da brute force;
- rate limiting;
- progressive delay;
- protezione contro credential stuffing;
- gestione sicura dei token;
- revoca dei token;
- logout lato server quando necessario;
- audit degli accessi amministrativi.

Non memorizzare mai password in chiaro e non usare algoritmi di hashing generici o obsoleti per le password.

## Fase 4 — Autorizzazione

Progetta o correggi l’autorizzazione server-side applicando:

- deny by default;
- controllo a ogni richiesta;
- separazione tra customer, staff, admin e super-admin;
- principio del minimo privilegio;
- controllo ownership delle risorse;
- autorizzazione per singolo oggetto;
- protezione da IDOR/BOLA;
- protezione degli endpoint amministrativi;
- separazione tra lettura e modifica;
- autorizzazione per rimborsi, export, cancellazioni e modifiche prezzo;
- audit delle operazioni privilegiate.

Non fidarti mai di:

- ruolo ricevuto dal frontend;
- user ID ricevuto dal client;
- prezzo ricevuto dal client;
- stato ordine ricevuto dal client;
- sconti ricevuti dal client;
- flag amministrativi lato frontend;
- hidden input;
- dati presenti soltanto nel local storage.

## Fase 5 — API e input

Verifica che tutte le API abbiano:

- validazione server-side;
- schema validation;
- allowlist dei campi;
- protezione da mass assignment;
- query parametrizzate;
- limiti sulla dimensione delle richieste;
- limiti sulla profondità dei payload;
- timeout;
- rate limiting;
- protezione CSRF quando necessaria;
- CORS restrittivo;
- errori generici verso il client;
- assenza di stack trace in produzione;
- versioning;
- idempotency key per operazioni sensibili;
- gestione sicura dei metodi HTTP;
- protezione contro replay;
- controllo dei content type;
- controllo degli header;
- protezione contro payload malformati.

Verifica in particolare:

- autenticazione di ogni endpoint privato;
- autorizzazione su ogni risorsa;
- impossibilità di enumerare utenti o ordini;
- impossibilità di modificare dati di altri utenti;
- impossibilità di modificare prezzi e totali;
- impossibilità di bypassare gli stati dell’ordine;
- impossibilità di creare ordini duplicati.

## Fase 6 — PostgreSQL

Analizza e metti in sicurezza PostgreSQL:

- database non esposto pubblicamente;
- accesso tramite rete privata o allowlist;
- TLS per le connessioni;
- ruoli separati;
- nessun uso del superuser da parte dell’applicazione;
- utente separato per le migration;
- permessi minimi;
- separazione tra lettura e scrittura quando possibile;
- separazione tra ambienti;
- protezione delle migration;
- query parametrizzate;
- protezione da SQL injection;
- Row-Level Security quando applicabile;
- policy RLS testate;
- protezione delle funzioni con privilegi elevati;
- backup cifrati;
- backup automatici;
- retention tecnica dei backup;
- test periodici di restore;
- audit degli accessi amministrativi;
- protezione dagli export massivi;
- cifratura dei campi ad alta sensibilità quando necessaria;
- gestione separata delle chiavi di cifratura;
- rotazione delle credenziali.

Crea test che dimostrino che:

- un utente non possa leggere i dati di un altro;
- un utente non possa modificare ordini altrui;
- un customer non possa accedere alle tabelle amministrative;
- l’applicazione non possa eseguire operazioni da superuser;
- un account compromesso abbia accesso limitato;
- le policy RLS non possano essere aggirate tramite endpoint o query alternative.

## Fase 7 — Stripe e pagamenti

Analizza tecnicamente l’integrazione Stripe.

Regole obbligatorie:

- non salvare numeri completi delle carte;
- non salvare CVV;
- non far transitare inutilmente dati carta dal backend;
- utilizzare Stripe Checkout, Stripe Elements o integrazione ufficiale equivalente;
- usare chiavi separate per ambiente;
- non esporre secret key nel frontend;
- non inserire chiavi nei log;
- verificare la firma dei webhook;
- usare HTTPS per i webhook;
- gestire eventi duplicati;
- gestire retry;
- usare idempotenza;
- verificare lato server importo, valuta, ordine e stato del pagamento;
- non considerare il redirect frontend come conferma del pagamento;
- gestire correttamente eventi fuori ordine;
- impedire manipolazioni di prezzo, quantità e sconti;
- proteggere refund e dispute;
- registrare audit tecnici degli eventi di pagamento;
- gestire errori e timeout senza creare ordini incoerenti.

Crea test per:

- firma webhook errata;
- webhook modificato;
- webhook duplicato;
- webhook ripetuto;
- replay;
- pagamento con importo differente;
- valuta differente;
- ordine inesistente;
- ordine già pagato;
- evento ricevuto fuori sequenza;
- doppio click sul pagamento;
- doppio tentativo di refund;
- timeout Stripe;
- risposta Stripe non valida.

Stripe documenta l’importanza di TLS, della verifica delle firme webhook e di un’integrazione che limiti l’esposizione ai dati delle carte. [31][33]

## Fase 8 — Frontend e browser

Verifica e configura:

- Content-Security-Policy;
- HSTS;
- X-Content-Type-Options;
- Referrer-Policy;
- Permissions-Policy;
- protezione clickjacking;
- frame-ancestors;
- CORS;
- cookie security;
- sanitizzazione dell’HTML;
- protezione DOM XSS;
- escaping contestuale;
- gestione sicura dei redirect;
- assenza di secret nel bundle;
- protezione del source map in produzione;
- gestione sicura degli script di terze parti;
- controllo degli script caricati;
- sicurezza del local storage;
- sicurezza del session storage;
- protezione da manipolazione del prezzo lato client.

Se esiste una CMP custom, analizzala esclusivamente dal punto di vista tecnico:

- bypass dei controlli;
- manipolazione dello stato;
- esecuzione di codice non autorizzato;
- injection negli script;
- accesso non autorizzato alla configurazione;
- esposizione di token;
- caricamento di risorse non previste;
- vulnerabilità XSS o supply chain.

Non analizzare la conformità legale della CMP.

## Fase 9 — Segreti e configurazione

Cerca e verifica:

- password;
- API key;
- token;
- secret key;
- webhook secret;
- certificati;
- credenziali database;
- chiavi di cifratura;
- token OAuth;
- access token cloud;
- credenziali CI/CD.

Implementa o raccomanda:

- secret manager;
- separazione per ambiente;
- rotazione;
- revoca;
- scadenza;
- secret scanning;
- rimozione dalla cronologia Git;
- accesso minimo;
- separazione tra secret frontend e backend;
- protezione dei log;
- protezione delle pipeline;
- branch protection;
- approvazione dei deploy;
- accesso limitato alla produzione.

Non stampare mai segreti nei log, negli errori, nei test o nel frontend.

## Fase 10 — Supply chain e CI/CD

Analizza:

- dipendenze obsolete;
- vulnerabilità note;
- dipendenze transitive;
- package sospetti;
- typosquatting;
- lockfile;
- script post-install;
- immagini Docker;
- base image;
- librerie frontend;
- codice generato dall’AI;
- action CI/CD;
- token della pipeline;
- permessi della pipeline;
- artifact;
- build;
- release;
- deploy.

Configura, se compatibile con lo stack:

- SAST;
- DAST;
- dependency scanning;
- secret scanning;
- container scanning;
- SBOM;
- linting di sicurezza;
- scansione delle configurazioni;
- verifica delle immagini;
- branch protection;
- deploy manuale in produzione;
- approvazione obbligatoria per modifiche critiche;
- blocco del deploy per vulnerabilità Critical e High non accettate.

## Fase 11 — Logging e monitoring tecnico

Definisci:

- eventi da registrare;
- eventi da non registrare;
- request ID;
- correlation ID;
- audit log;
- accessi amministrativi;
- tentativi di login falliti;
- escalation di privilegi;
- modifiche di prezzo;
- modifiche di ruolo;
- refund;
- errori webhook;
- eventi duplicati;
- export;
- errori applicativi;
- anomalie di traffico;
- rate limit superati.

Verifica che i log non contengano:

- password;
- secret;
- token;
- numeri completi di carta;
- CVV;
- session ID completi;
- dati inutilmente sensibili;
- payload completi non necessari.

Definisci alert tecnici per:

- brute force;
- account takeover;
- accessi amministrativi anomali;
- aumento degli errori 4xx e 5xx;
- webhook falliti;
- pagamenti anomali;
- export massivi;
- accessi al database;
- modifiche infrastrutturali;
- dipendenze vulnerabili;
- secret esposti.

## Fase 12 — Incident response tecnica

Crea un runbook tecnico per:

- compromissione di un account admin;
- compromissione di una API key;
- compromissione di una secret key Stripe;
- SQL injection;
- data leakage;
- malware;
- dipendenza compromessa;
- database compromesso;
- webhook manipolati;
- ordini alterati;
- ransomware;
- perdita dei backup;
- compromissione della pipeline CI/CD.

Il runbook deve indicare:

- rilevazione;
- contenimento;
- revoca credenziali;
- rotazione secret;
- isolamento dei servizi;
- conservazione delle evidenze;
- verifica dell’integrità;
- ripristino;
- monitoraggio successivo;
- post-mortem tecnico.

## Fase 13 — Test di sicurezza

Crea ed esegui, quando possibile:

- test autenticazione;
- test autorizzazione;
- test IDOR/BOLA;
- test privilege escalation;
- test SQL injection;
- test XSS;
- test CSRF;
- test SSRF;
- test rate limiting;
- test session management;
- test password reset;
- test CORS;
- test security headers;
- test file upload;
- test webhook;
- test idempotenza;
- test replay;
- test race condition;
- test manipolazione prezzi;
- test manipolazione ordini;
- test accesso PostgreSQL;
- test RLS;
- test secret leakage;
- test dipendenze;
- test container;
- test backup e restore;
- test error handling;
- test log leakage.

Distingui tra:

- test automatici;
- test manuali;
- test da eseguire in staging;
- test da eseguire in produzione;
- test che richiedono autorizzazione;
- test da affidare a un penetration tester.

Non eseguire attività distruttive o intrusive in produzione senza autorizzazione esplicita.

## Deliverable obbligatori

Crea questi file:

- `docs/security/SECURITY_ARCHITECTURE.md`
- `docs/security/SECURITY_GUIDE.md`
- `docs/security/THREAT_MODEL.md`
- `docs/security/ATTACK_SURFACE.md`
- `docs/security/SECURITY_REQUIREMENTS.md`
- `docs/security/SECURITY_TEST_PLAN.md`
- `docs/security/INCIDENT_RESPONSE_TECHNICAL.md`
- `docs/security/SECRETS_MANAGEMENT.md`
- `docs/security/SECURITY_CHANGELOG.md`
- `docs/security/RESIDUAL_RISKS.md`

Crea inoltre, quando compatibile con il progetto:

- test di sicurezza automatici;
- configurazione SAST;
- configurazione DAST;
- dependency scanning;
- secret scanning;
- container scanning;
- security headers;
- rate limiting;
- audit logging;
- policy PostgreSQL;
- test RLS;
- gestione idempotente dei webhook;
- controlli CI/CD;
- checklist di security code review.

## Formato del report finale

Il report finale deve contenere:

1. Executive summary tecnico;
2. architettura analizzata;
3. superficie d’attacco;
4. asset tecnici;
5. threat model;
6. vulnerabilità trovate;
7. vulnerabilità corrette;
8. modifiche applicate;
9. test eseguiti;
10. test falliti;
11. problemi non verificabili;
12. rischi residui;
13. raccomandazioni;
14. piano di remediation;
15. attività da affidare a un penetration tester;
16. checklist tecnica pre-produzione.

Per ogni vulnerabilità usa questo formato:

- ID;
- titolo;
- severità;
- componente;
- descrizione;
- scenario d’attacco;
- impatto;
- evidenza;
- correzione;
- file modificati;
- test di verifica;
- stato;
- rischio residuo.

Prima di dichiarare il progetto tecnicamente pronto al go-live verifica che:

- non ci siano segreti esposti;
- tutti gli endpoint privati richiedano autenticazione;
- ogni risorsa abbia un controllo autorizzativo server-side;
- il database non sia esposto pubblicamente;
- PostgreSQL utilizzi ruoli con privilegi minimi;
- le query siano parametrizzate;
- i webhook Stripe siano firmati e idempotenti;
- i prezzi siano calcolati e verificati lato server;
- i dati carta non siano salvati;
- siano configurati gli header di sicurezza;
- siano presenti rate limiting e protezioni anti-abuso;
- siano stati analizzati codice e dipendenze;
- i log non espongano secret o token;
- i backup siano cifrati;
- sia stato testato un restore;
- esista un piano tecnico di incident response;
- siano documentati i rischi residui.

Inizia dalla Fase 1. Non modificare il codice prima di aver prodotto l’inventario tecnico, la superficie d’attacco, la mappa dei flussi e il threat model preliminare.