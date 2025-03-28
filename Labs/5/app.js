/*
    ChatGPT was used for debugging and as a search tool when 
    hosting server2 on Digital Ocean
*/
const messages = require("./lang/en/en");

const mysql = require('mysql2');
const http = require('http');
const url = require('url');

// Database connection variables
const host = process.env.DB_HOST;
const dbPort = process.env.DB_PORT;
const user = process.env.DB_USER;
const password = process.env.DB_PASSWORD;
const database =  process.env.DB_DATABASE;

// Sql query building
const insertQuery = `INSERT INTO patients (name, dateOfBirth) VALUES %1 ;`;
const insertValues = `('%1', '%2 00:00:00')`;

// Create table if not exists
const createTableQuery = `
    CREATE TABLE IF NOT EXISTS patients (
      patientid INT NOT NULL AUTO_INCREMENT,
      name VARCHAR(100),
      dateOfBirth datetime,
      PRIMARY KEY(patientid)
    )
  `;

/*
    Represents a repository for the database, handling all database 
    related operations 
*/
class Repository {

    // Establishes variables used to conncet to database
    constructor(host, user, password, database, port) {
        this.host = host;
        this.port = port;
        this.user = user;
        this.password = password;
        this.database = database;
        this.con = null;
    }

    // connects to the database
    init() {
        // Creates a connection 
        this.con = mysql.createConnection({
            host: this.host,
            user: this.user,
            port: this.port,
            password: this.password,
            database: this.database
        });

        // Connects the connection
        this.con.connect((err) => {
            if (err) {
                console.error("Database connection failed:", err);
                return false;
            }
            return true;
        });
    }

    // Inserts patients from a list of new patients into the database
    async insertPatients(patients) {

        // Creates an array of strings for all the values that need to be inserted into
        // the table patients
        const values = []
        for (let i = 0; i < patients.length; i++) {
            const vals = insertValues.replace('%1', patients[i]['name']).replace('%2', patients[i]['dateOfBirth']);
            values.push(vals);
        };

        // Creates a single insert statement for all the values
        const allValues = values.join(',');
        const query = insertQuery.replace('%1', allValues);

        // Runs the insert query
        try {
            const result = await this.runQuery(query);
            return result;
        } catch(err) {
            return null;
        }
       
    }

    // Runs a query 
    async runQuery(query) {
        //Returns a promise
        //Reject and resolve are not defined defaulting to
        //Resolve acting like return
        //Reject acting like a throw
        await this.con.execute(createTableQuery);
        return new Promise((resolve, reject) => {
            this.con.query(query, (err, result) => {
                if (err) {
                    reject(err);
                } else {
                    resolve(result);
                }
            });
        });
    }
}

/*
    Represents a server that connects to a database of patients
*/
class Server {

    // Establishes port for server and creates a repository to use to edit the database
    constructor(port, host, user, password, database, dbPort) {
        this.port = port;
        this.repo = new Repository(host, user, password, database, dbPort);
        this.repo.init();
    }

    //Handles the request
    async handleRequest(req, res) {

        const reqUrl = url.parse(req.url, true);
        if (req.method === "POST") { //POST request handling
            //Get the request body
            let body = "";
            req.on("data", chunk => {
                body += chunk;
            });

            //Handle the post once all the request body was recieved
            req.on("end", async() => {
                await this.handlePost(body, reqUrl.pathname, res);
                res.end(); //send response
            });
        } else if (req.method === "GET") { //GET request handling
            //Handle the get Request
            await this.handleGet(reqUrl.query.sql, res);

            res.end();
        } else { //Anything but a GET or POST is unimplemented
            res.writeHead(501); //501 - unimplemented (server error)

            //Response for unimplemented server
            const serverRes = JSON.stringify({
                message: messages.messages.BadRequest
            });

            //Write response
            res.write(serverRes);

            res.end();
        }
    }

    //Handles GET requests
    async handleGet(query, res) {
        let serverRes;
        if (query) { //query is not null
            const result = await this.runQuery(query);
            if(result.errno){ //if there was a mysql error
                serverRes = JSON.stringify({
                    message: result.sqlMessage
                });
                res.writeHead(400); //400 - bad request
            } else { // No error from database
                serverRes = JSON.stringify({
                    data: result
                });
                res.writeHead(200); //200 - success
            }
        } else { //No sql query in query
            serverRes = JSON.stringify({
                message: messages.messages.BadRequest
            });
            res.writeHead(400); // 400 - bad request
        }  
        res.write(serverRes);
    }

    async handlePost(body, path, res) {
        const jsonBody = JSON.parse(body);
        let serverRes;
        if (path === '/insert') {
            const result = await this.repo.insertPatients(jsonBody);
            if(result){
                serverRes = JSON.stringify({
                    data: messages.messages.SuccessfulInsert
                });
                res.writeHead(200); //200 - success
            } else {
                serverRes = JSON.stringify({
                    message: messages.messages.DBError
                });
                res.writeHead(500); // 500 - server error
            }

        } else if (path === '/query') {
            const result = await this.runQuery(jsonBody['sql']);
            if(result.errono){ // There was a mysql error
                serverRes = JSON.stringify({
                    message: result.sqlMessage
                });
                res.writeHead(400); //400 - bad request
            } else { // No error from database
                serverRes = JSON.stringify({
                    data: messages.messages.SuccessfulInsert
                });
                res.writeHead(200); //200 - success
            } 
        } else {
            serverRes = JSON.stringify({
                message: messages.messages.PageNotFound
            });
            res.writeHead(404); //400 - not found
        }
        res.write(serverRes);
    }

    // Runs a query to the repo and returns either its result or an error
    async runQuery(query){
        let result;
        try {
            result = await this.repo.runQuery(query);
        } catch (err) {
            return err;
        }
        return result;
    }

    //Starts the server
    startServer() {
        http.createServer((req, res) => {

            //Allowing AJAX calls
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers', 'GET, POST');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            //Handles OPTIONS pre-flight requests from CORS
            if (req.method === "OPTIONS") {
                res.writeHead(204);
                res.end();
                return;
            }

            res.setHeader('Content-Type', 'application/json'); //returning json responses from server
            this.handleRequest(req, res);

        }).listen(this.port, () => {
            console.log(`Server is running at port ${this.port}`);
        }); // listens on the passed in port
    }
}

const server = new Server(8000, host, user, password, database, dbPort);
server.startServer();