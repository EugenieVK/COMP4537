const btnElement = "button";
const textElement = "textarea";
const divElement = "div";

const notesContainerId = "notes";
const buttonsContainerId = "buttonsDiv";
const addBtnId = "addBtn";
const updateMsgId = "updateTime";
const writerBtnId = "writerBtn";
const readerBtnId = "readerBtn";

const removeBtnClass = "removeBtn";
const backBtnClass = "backBtn";
const noteDivClass = "noteContainer";

const keyString = "notes";

const indexPageLink = "index.html";
const writerPageLink = "writer.html";
const readerPageLink = "reader.html";


class Button {
    constructor(msg){
        this.btn = document.createElement(btnElement);
        this.btn.innerHTML = msg;
    }

    addOnClickEvent(func){
        this.btn.onclick = func;
    }

    getBtn(){
        return this.btn;
    }
}

class BackButton extends Button {
    constructor(msg){
        super(msg);
        this.btn.classList.add(backBtnClass);
        this.addOnClickEvent(()=>{
            window.location.href = indexPageLink;
        });
    }
}

class ReturnButton extends Button {
    constructor(msg){
        super(msg);
        this.btn.classList.add(removeBtnClass);
    }
}

class Note {
    constructor(text){
        this.text = text;
        this.noteContainer = document.createElement(divElement);
        this.noteContainer.classList.add(noteDivClass);

        this.textField = document.createElement(textElement);
        this.textField.innerHTML = this.text;
        this.noteContainer.appendChild(this.textField);
    }

    getNoteElement(){
        return this.noteContainer;
    }
}

class WriterNote extends Note{
    constructor(text = ""){
        super(text);
        this.removeBtn = new ReturnButton(messages.removeBtnMsg);
        this.noteContainer.appendChild(this.removeBtn.getBtn());
    }
   
    addChangeEvent(func){
        this.textField.addEventListener("change", ()=>{
            this.text = this.textField.value;
            func();
        });
    }

    addRemoveButtonEvent(writer){
        this.removeBtn.addOnClickEvent(()=>{
            writer.removeNote(this);
        });
    }

}


class Writer {
    constructor(){
        this.notes = [];
        this.getNotes();
        this.notesContainer = document.getElementById(notesContainerId);

        this.updateMsg = document.getElementById(updateMsgId);
        this.updateMessage();

        this.createAddButton();
        this.createBackButton();
    }

    createBackButton(){
        const backButton = new BackButton(messages.backBtnMsg);
        document.getElementById(buttonsContainerId).appendChild(backButton.getBtn());
    }

    createAddButton(){
        const addButton = document.getElementById(addBtnId);
        addButton.innerHTML = messages.addBtnMsg;
        addButton.onclick = () => {this.addNote()};
    }

    getNotes(){
        const jsonNotes = JSON.parse(window.localStorage.getItem(keyString));
        if(jsonNotes != null){
            jsonNotes.forEach((note)=>{
                const newNote = this.createNote(note.text);
                this.notes.push(newNote);
            });
        }
        
    }

    createNote(text = ""){
        const newNote = new WriterNote(text);
        newNote.addRemoveButtonEvent(this);
        newNote.addChangeEvent(()=>{
            this.storeNotes();
        });

        return newNote;
    }

    addNote(){
        const newNote = this.createNote();
        this.notes.push(newNote);
        this.notesContainer.appendChild(newNote.getNoteElement());
        this.updateMessage();
        this.storeNotes();
       
    }

    removeNote(delNote){
        this.notes.forEach((note, i) =>{
            if(note === delNote){
                this.notes.splice(i, 1);
            }
        });
        this.storeNotes();
        this.displayNotes();
    }

    updateMessage(){
        const time = new Date().toLocaleTimeString();
        this.updateMsg.innerHTML = messages.storedMsg + time;
    }

    displayNotes(){
        this.notesContainer.innerHTML = "";
        this.notes.forEach((note)=>{
            this.notesContainer.appendChild(note.getNoteElement());
        });
    }

    storeNotes() {
        window.localStorage.setItem(keyString, JSON.stringify(this.notes));
        this.updateMessage();
    }
}

class Reader {
    constructor(){
        this.notes = [];
        this.getNotes();
        this.notesContainer = document.getElementById(notesContainerId);
        this.displayNotes();

        this.updateMsg = document.getElementById(updateMsgId);
        this.updateMessage();

        this.createBackButton();
    }

    createBackButton(){
        const backButton = new BackButton(messages.backBtnMsg);
        document.getElementById(buttonsContainerId).appendChild(backButton.getBtn());
    }

    setLocalStorageListener(){
        window.addEventListener("storage", ()=>{
            this.updateNotes();
        });
    }

    getNotes(){
        this.notes = [];
        const jsonNotes = JSON.parse(window.localStorage.getItem(keyString));
        if(jsonNotes != null){
            jsonNotes.forEach((note)=>{
                this.notes.push(new Note(note.text));
            });
        }
    }

    updateMessage(){
        const time = new Date().toLocaleTimeString();
        this.updateMsg.innerHTML = messages.updatedMsg + time;
    }

    displayNotes(){
        this.notesContainer.innerHTML = "";
        this.notes.forEach((note)=>{
            this.notesContainer.appendChild(note.getNoteElement());
        });
    }

    updateNotes(){
        this.getNotes();
        this.displayNotes();
        this.updateMessage();
    }

    startAutoUpdate(){
        setInterval(()=>{this.updateNotes()}, 2000);
    }

}

class Home {
    constructor(){
        this.writerLink = document.getElementById(writerBtnId);
        this.readerLink = document.getElementById(readerBtnId);
    }

    setUpNotepadLinks(){
        this.writerLink.innerHTML = messages.writerBtnMsg;
        this.writerLink.onclick = this.openWriterPage;
        
        this.readerLink.innerHTML = messages.readerBtnMsg;
        this.readerLink.onclick = this.openReaderPage;
    }

    openWriterPage(){
        window.location.href = writerPageLink;
    }

    openReaderPage(){
        window.location.href = readerPageLink;
    }
}

if(window.location.href.includes(indexPageLink)){
    const homePage = new Home();
    homePage.setUpNotepadLinks();
} else if(window.location.href.includes(writerPageLink)){
    const writerPage = new Writer();
    writerPage.displayNotes();
} else if(window.location.href.includes(readerPageLink)){
    const readerPage = new Reader();
    readerPage.setLocalStorageListener();
    readerPage.startAutoUpdate();
}
