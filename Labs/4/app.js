//Imports
const messages = require("./lang/en/en");
const http = require("http");
const url = require("url");

//Reprenets a server hosting a dictionary
class DictionaryServer {
    //Constructs the DicitionaryServer
    //PRE: port must be an open port at the hosting location
    constructor(port) {
        this.port = port;
        this.dictionary = [];
        this.lastUpdated = "NO UPDATES";
        this.requestCount = 0;
    }

    //Adds a word and its definition to the dictionary
    //Returns false if definition couldn't be added because it already exists
    //Returns true if definition was successfully added
    addDefinition(word, def) {
        //Filters through dictionary to check if the word already exists within it
        const check = this.dictionary.filter((defPair) => {
            //defPair = {word: def} json object so we filter through its keys 
            //[0] is to grab the first key in the json object (the only key in this case)
            //Is the key equal to our word? Yes = add it to the list check, no = don't add it
            return Object.keys(defPair)[0] === word; 
        });

        
        if (check.length > 0) {
            return false; //Check filter returned something, word exist
        } else {
            //create a new json object
            //Required to do it this way as otherwise the key was always "word"
            const newDef = JSON.parse(`{"${word}" : "${def}"}`);
            this.dictionary.push(newDef); 
            this.lastUpdated = this.getDate(); //Update last update date to now
            return true; //Definition has been added
        }
    }

    //Gets a definition for the word from the dictionary
    //Returns the definition if the word is defined and null if not
    getDefinition(word) {
        //Find the definition-word pair for the word
        const foundWords = this.dictionary.filter((defPair) => {
            return Object.keys(defPair)[0] === word;
        });

        //If the word was found return the definition
        //else return null
        if (foundWords.length > 0) {
            return foundWords[0][word];
        } else {
            return null;
        }
    }

    //Gets the current date in a "Febuary 8 2025" format
    getDate() {
        const date = new Date().toDateString().split(" ");
        date.shift()
        return date.join(" ");
    }

    //Handles the request
    handleRequest(req, res) {

        if (req.method === "POST") { //POST request handling
            //Get the request body
            let body = "";
            req.on("data", chunk => {
                body += chunk;
            });

            //Handle the post once all the request body was recieved
            req.on("end", () => {
                this.handlePost(body, res)
                res.end(); //send response
            });
        } else if (req.method === "GET") { //GET request handling
            //Get the word from the url
            const word = url.parse(req.url, true).query.word;

            //Handle the get Request
            this.handleGet(word, res);
            
            res.end();
        } else { //Anything but a GET or POST is unimplemented
            res.writeHead(501); //501 - unimplemented (server error)

            //Response for unimplemented server
            const serverRes = JSON.stringify({
                    "message": messages.messages.BadRequest,
                    "requestNumber": this.requestCount
            });

            //Write response
            res.write(serverRes);
            
            res.end();
        }
    }

    //Handles GET requests
    handleGet(word, res){
        let serverRes = "";
        if(word){ //Word is not null
            const def = this.getDefinition(word);
            if(def){ //Definition exists
                serverRes = JSON.stringify({
                    "definition": def,
                    "requestNumber": this.requestCount
                });
                res.writeHead(200); //200 - success

            } else { //No definition
                serverRes = JSON.stringify({
                    "message": messages.messages.WordNotFound,
                    "requestNumber": this.requestCount
                });
                res.writeHead(404); //404 - not found
            }
        } else { //No word in query
            serverRes = JSON.stringify({
                "message": messages.messages.BadRequest,
                "requestNumber": this.requestCount
            });
            res.writeHead(400); //400 - bad request
        }

        res.write(serverRes);
    }

    //Handles POST request
    handlePost(body, res) {
        //Parses for the new word and definition
        const jsonBody = JSON.parse(body);
        const word = jsonBody["word"];
        const def = jsonBody["definition"];

        let serverRes = "";
        if (word && def) { //Both word and definition are not null
            const didAdd = this.addDefinition(word, def);
            if (didAdd){ //Word was added to dictionary

                //Build the new entry message
                const message = messages.messages.NewEntry
                    .replace("%1", this.lastUpdated)
                    .replace("%2", `"${word}" - ${def}`)
                    .replace("%3", this.dictionary.length);

                serverRes = JSON.stringify({
                    "message": message, 
                    "requestNumber": this.requestCount,
                });
                res.writeHead(200); // 200 - success
            } else { //Word could not be added cause it was already in dictionary
                serverRes = JSON.stringify({
                    "message": messages.messages.DuplicateWordWarning,
                    "requestNumber": this.requestCount
                });
                res.writeHead(400); // 400 - bad request
            }
        } else { //Either or both word and definition were null
            serverRes = JSON.stringify({
                "message": messages.messages.BadRequest,
                "requestNumber": this.requestCount
            });
            res.writeHead(400); //400 - bad request
        }

        res.write(serverRes); // write response
    }

    //Starts the server
    startServer() {
        http.createServer((req, res) => {

            //Allowing AJAX calls
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Headers' ,'GET, POST');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

            //Handles OPTIONS pre-flight requests from CORS
            if(req.method === "OPTIONS"){
                res.writeHead(204);
                res.end();
                return;
            }

            //Iterate requestCount as now a request to server is being handled 
            this.requestCount++;     
            res.setHeader('Content-Type', 'application/json'); //returning json responses from server
            
            const path = url.parse(req.url).pathname;
            if(path === "/api/definitions" || path === "/api/definitions/"){ //Correct address used for call

                this.handleRequest(req, res);
            } else { //incorrect address

                const serverRes = JSON.stringify({
                    "message": messages.messages.PageNotFound,
                    "requestNumber": this.requestCount
                });
                res.writeHead(404); // 404 - not found
                res.write(serverRes);
                res.end();
            }

        }).listen(this.port, ()=>{ 
            console.log(`Server is running at port ${this.port}`);
        }); // listens on the passed in port
    }
}

//make a Dictionary Server on port 8000 and start it
const server = new DictionaryServer(8000);
server.startServer();

