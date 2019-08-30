const Parser = require("binary-parser-encoder").Parser;
const fs = require("fs");
const FixedRecordFile = require("./fixedRecordFile.js");

/**
 * CircularFile is a data storage format that limits the number
 * of records stored in the data file.  Once that record limit
 * is reached, the first record is dropped from the file
 * to make room for the new record. 
 */
module.exports = class CircularFile extends FixedRecordFile {

    constructor(record_parser, maxRecordCount) {
        super(record_parser, function (parser) {
                                return parser.uint32("firstRecordNum")
                                             .uint32("lastRecordNum")
                             }
            );

        this.maxRecordCount = maxRecordCount;
    }



    appendRecord(rec) {
        let rcount = this.recordCount();
        var newRecNum;
        if (rcount < this.maxRecordCount) {
            // Add a new record at the end of the file
            newRecNum = rcount;
            this.header.lastRecordNum = newRecNum;
            this.header.recordCount++;
        }
        else {
            // The file is full.  Drop the first record and write
            // over it with the last.
            newRecNum = this.header.firstRecordNum;
            this.header.firstRecordNum = (this.header.firstRecordNum + 1) % this.maxRecordCount;
            this.header.lastRecordNum = newRecNum;
        }
        this.writeRecord(newRecNum, rec);
        this.writeHeader();
    }


    getFirst() {
        if (this.header.recordCount > 0) {
            this.filePointer = this.header.firstRecordNum;
            return this.readRecord(this.filePointer);
        }
        else {
            return null;
        }
    }


    getNext() {
        if (this.filePointer != this.header.lastRecordNum) {
            this.filePointer = (this.filePointer + 1) % this.maxRecordCount;
            return this.readRecord(this.filePointer);
        }
        else {
            return null;
        }
    }


    getCurrentRecordNumber() {
        return this.filePointer;
    }

}

