const Parser = require("binary-parser-encoder").Parser;
const fs = require("fs");
const FixedRecordFile = require("./fixedRecordFile.js");

/**
 * CircularFile is a data storage format that limits the number
 * of records stored in the data file.  Once that record limit
 * is reached, the first record is dropped from the file
 * to make room for the new record. Iterating over this
 * circular list should be done using getFirst() and
 * getNext(), as record zero is not necessarily the first
 * record in the circular list.
 */
module.exports = class CircularFile extends FixedRecordFile {

    /**
     * Constructs a circular file that holds no more than
     * maxRecordCount records of an object stored using
     * the specified record_parser definition.
     * @param {Parser} record_parser 
     * @param {integer} maxRecordCount 
     */
    constructor(record_parser, maxRecordCount) {
        super(record_parser, function (parser) {
                                return parser.uint32("firstRecordNum")
                                             .uint32("lastRecordNum")
                             }
            );

        this.maxRecordCount = maxRecordCount;
    }


    /**
     * Adds the specified record to the end of the list. This
     * may or may not be the last physical record of the file,
     * so do not rely on the record count to determine what
     * record it was added to. Use getCurrentRecordNumber()
     * instead.
     * @param {object} rec An object that contains the record data to encode. It must match the record_parser
     *    specified when this object was constructed.
     */
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
        this.filePointer = newRecNum;
    }


    /**
     * Retrieves and returns the first record in the circular list. To
     * retrieve the record after that, call getNext(). null is 
     * returned if there are no records in the file.
     */
    getFirst() {
        if (this.header.recordCount > 0) {
            this.filePointer = this.header.firstRecordNum;
            return this.readRecord(this.filePointer);
        }
        else {
            return null;
        }
    }


    /**
     * Retrieves and returns the NEXT record in the circular list following
     * a call to getFirst(). null is returned if there are no more records
     * remaining.
     */
    getNext() {
        if (this.filePointer != this.header.lastRecordNum) {
            this.filePointer = (this.filePointer + 1) % this.maxRecordCount;
            return this.readRecord(this.filePointer);
        }
        else {
            return null;
        }
    }

}
