const Parser = require("binary-parser-encoder").Parser;
const fs = require("fs");


/**
 * FixedRecordFile is a binary file that stores data in a "fixed width" format.
 * Records are read and written using readRecord() and writeRecord() and specifying
 * a "record number". Records are numbered "zero" thru recordCount() - 1.
 */
module.exports = class FixedRecordFile {

    /**
     * Constructs a FixedRecordFile object for reading and writing
     * binary records. record_parser defines the binary format of
     * the record. header_extend_function is an optional parameter
     * that adds specific data to the header record. 
     * @param {Parser} record_parser A parser from the 'binary-parser-encoder' module that
     *   defines the data record stored in this file.  While it may contain variations in
     *   the record using the choice() method, it is CRITICAL that the record size be
     *   constant.
     * @param {function (header_parser)} header_extend_function An optional function that
     *   can be used to add additional fields to the header record stored as the first
     *   record of the file. By default, the header record contains only two fields:
     *   recordSize and recordCount.
     */
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


    /**
     * Opens the data file for reading/writing.  If the file does not exist, it is created.
     * Be sure to call close() when you are finished.
     * @param {string} fileName The name of the file to open.
     */
    open(fileName) {

        this.fileName = fileName;
        if (!fs.existsSync(fileName)) {
            this._createFile(fileName);
        }
        else {
            this.fd = fs.openSync(fileName, "r+");
            this.header = this.readHeader();
            if (this.header.recordSize != this.recordSize) {
                throw new Error(`Record size of file (${this.header.recordSize}) does not match defined record size (${this.recordSize})`);
            }
        }
    }

    /**
     * Closes the data file and releases the file resources.
     */
    close() {
        if (this.fd) {
            fs.closeSync(this.fd);
        }
        this.fd = null;
    }


    /**
     * Private method used by this class, it is called by open() when the file does not exist.
     * @param {*} fileName 
     */
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


    /**
     * Creates the header record when the file is first created. The default parses a 
     * binary version of the header that is zero filled. That means numbers will be zero,
     * and strings will be of zero length.
     */
    createHeader() {
        return this.headerParser.parse(this.binHeader);
    }


    /**
     * Reads the header record from the file and returns the result. This is used
     * by open() when opening a pre-existing file.
     */
    readHeader() {
        this.binHeader = Buffer.alloc(this.headerSize);
        let numRead = fs.readSync(this.fd, this.binHeader, 0, this.headerSize, 0);
        if (numRead != this.headerSize) {
            throw new Error(`Could not read header (wanted ${this.headerSize} bytes, read ${numRead})`);
        }
        return this.headerParser.parse(this.binHeader);      
    }


    /**
     * Writes the contents of this.header to the file. Should be called whenever code outside
     * of this class modifies the header record.
     */
    writeHeader() {      
        this.binHeader = this.headerParser.encode(this.header);
        let written = fs.writeSync(this.fd, this.binHeader, 0, this.headerSize, 0);
        if (written != this.headerSize) {
            throw new Error(`Could not write header (tried ${this.headerSize} bytes, wrote ${written})`);            
        }
    }


    /**
     * Reads the specified record number from the binary file, decodes it, and returns the Javascript object that
     * represents it.  
     * @param {integer} recordNum the number to read - zero thru recordCount()-1
     */
    readRecord(recordNum) {
        let pos = this._recordPos(recordNum);
        this.binRecord = Buffer.alloc(this.recordSize);
        let numRead = fs.readSync(this.fd, this.binRecord, 0, this.recordSize, pos);
        if (numRead != this.recordSize) {
            throw new Error(`Could not read record #${recordNum} (wanted ${this.recordSize} bytes, read ${numRead})`);
        }
        let rec = this.recordParser.parse(this.binRecord);
        return rec;
    }

    /**
     * Writes the specified record to the binary file by encoding rec in its binary equivelant and writing
     * that data out to the data file at the specified record number.
     * @param {integer} recordNum The record to write - zero thru recordCount(). Note that existing records
     *    are numbered starting at zero, so specifying a value that is the same are recordCount() will in 
     *    fact add a new record to the file.  It is the same as calling appendRecord()
     * @param {object} rec An object that contains the record data to encode. It must match the record_parser
     *    specified when this object was constructed.
     */
    writeRecord(recordNum, rec) {      
        let pos = this._recordPos(recordNum);
        this.binRecord = this.recordParser.encode(rec);
        let written = fs.writeSync(this.fd, this.binRecord, 0, this.recordSize, pos);
        if (written != this.recordSize) {
            throw new Error(`Could not write record #${recordNum} (tried ${this.recordSize} bytes, wrote ${written})`);            
        }        
    }

    /**
     * Adds the specified record to the end of the file.
     * @param {object} rec An object that contains the record data to encode. It must match the record_parser
     *    specified when this object was constructed.
     */
    appendRecord(rec) {
        let newRecNum = this.recordCount();
        this.writeRecord(newRecNum, rec);
        this.header.recordCount++;
        this.writeHeader();
    }


    /**
     * Used internally by this class, it calculations the actual byte position within the file
     * where the specified record number starts. 
     * @param {integer} recordNum 
     */
    _recordPos(recordNum) {
        return recordNum * this.recordSize + this.headerSize;
    }

    
    /**
     * Returns the number of records that exist in the file.
     */
    recordCount() {   
        if (this.header) {
            return this.header.recordCount;
        }
        else {
            throw new Error("Can not get record count - BinaryFile not opened yet.");
        }
    }

}

