const Parser = require("binary-parser-encoder").Parser;
const fs = require("fs");

module.exports = class FixedWidthBinaryFile {

    constructor(record_parser, header_extend_function) {

        this.recordParser = record_parser;
        this.recordSize = this.recordParser.sizeOf();

        let header_parser = new Parser()
                                .uint16("recordSize")
                                .uint32("recordCount");
        if (header_extend_function) {
            this.headerParser = header_extend_function(header_parser);
        }
        else {
            this.headerParser = header_parser;
        }

        this.headerSize = this.headerParser.sizeOf();

        this.fd = null;
    }


    open(fileName) {

        this.fileName = fileName;
        if (!fs.existsSync(fileName)) {
            this._createFile(fileName);
        }
        else {
            this.fd = fs.openSync(fileName, "r+");
            this.binHeader = Buffer.alloc(this.headerSize);
            let numRead = fs.readSync(this.fd, this.binHeader, 0, this.headerSize, 0);
            if (numRead != this.headerSize) {
                throw new Error(`Could not read complete header (wanted ${this.headerSize} bytes, read ${numRead})`);
            }
            this.header = this.headerParser.parse(this.binHeader);
            if (this.header.recordSize != this.recordSize) {
                throw new Error(`Record size of file (${this.header.recordSize}) does not match defined record size (${this.recordSize})`);
            }
        }
    }


    close() {
        if (this.fd) {
            fs.closeSync(this.fd);
        }
        this.fd = null;
    }


    _createFile(fileName) {
        this.binHeader = Buffer.alloc(this.headerSize);
        this.fd = fs.openSync(fileName, "a+");
        let written = fs.writeSync(this.fd, this.binHeader, 0, this.headerSize, 0);
        if (written != this.headerSize) {
            throw new Error(`Could not write new header (tried ${this.headerSize} bytes, wrote ${written})`);            
        }
        this.header = this.createHeader();
        this.header.recordSize = this.recordSize;
        this.writeHeader();
    }


    createHeader() {
        return this.headerParser.parse(this.binHeader);
    }


    readHeader() {
        this.binHeader = Buffer.alloc(this.headerSize);
        let numRead = fs.readSync(this.fd, this.binHeader, 0, this.headerSize, 0);
        if (numRead != this.headerSize) {
            throw new Error(`Could not read header (wanted ${this.headerSize} bytes, read ${numRead})`);
        }
        return this.headerParser.parse(this.binHeader);      
    }

    writeHeader() {      
        this.binHeader = this.headerParser.encode(this.header);
        let written = fs.writeSync(this.fd, this.binHeader, 0, this.headerSize, 0);
        if (written != this.headerSize) {
            throw new Error(`Could not write header (tried ${this.headerSize} bytes, wrote ${written})`);            
        }
    }


    readRecord(recordNum) {
        let pos = this.recordPos(recordNum);
        this.binRecord = Buffer.alloc(this.recordSize);
        let numRead = fs.readSync(this.fd, this.binRecord, 0, this.recordSize, pos);
        if (numRead != this.recordSize) {
            throw new Error(`Could not read record #${recordNum} (wanted ${this.recordSize} bytes, read ${numRead})`);
        }
        let rec = this.recordParser.parse(this.binRecord);
        return rec;
    }

    writeRecord(recordNum, rec) {      
        let pos = this.recordPos(recordNum);
        this.binRecord = this.recordParser.encode(rec);
        let written = fs.writeSync(this.fd, this.binRecord, 0, this.recordSize, pos);
        if (written != this.recordSize) {
            throw new Error(`Could not write record #${recordNum} (tried ${this.recordSize} bytes, wrote ${written})`);            
        }        
    }


    appendRecord(rec) {
        let newRecNum = this.recordCount();
        this.writeRecord(newRecNum, rec);
        this.header.recordCount++;
        this.writeHeader();
    }


    recordPos(recordNum) {
        return recordNum * this.recordSize + this.headerSize;
    }

    
    recordCount() {   
        if (this.header) {
            return this.header.recordCount;
        }
        else {
            throw new Error("Can not get record count - BinaryFile not opened yet.");
        }
    }

}

