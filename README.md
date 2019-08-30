structured-binary-file
======================
Classes that read and write binary data to fixed with structured files - the way databases used to be stored on PCs before SQL came around ;)

Files composed of fixed width binary records have an advantage in that records can be quickly retrieved based on a
simple calculation.  They are generally smaller than text based storage in that numbers are stored in their binary representation vs character sequences, and the field values are based on record position vs. some other type of
data value delimeter.

This module also contains an implementation of a CircularFile, which builds on FixedRecordFile but limits it to
a maximum number of records.  Once that record limit has been reached, new appends drop the oldest record for
the newer record.  This makes implementing things like rolling logs very simple.

Records in FixedRecordFile and its derivitives are defined using the binary encoder/decoder found in the
project binary-parser-encoder[https://www.npmjs.com/package/binary-parser-encoder].

Here is an example (complete examples can be found in the src/examples directory):
```
const FixedRecordFile = require("structured-binary-file").FixedRecordFile;
const Parser = require("binary-parser-encoder").Parser;

let PersonRecord = Parser.start()
                        .uint16("id")
                        .string("firstName", { length: 15, trim: true })
                        .string("lastName", { length: 25, trim: true })
                        .nest("address", { type: Parser.start()
                                                .uint32("number")
                                                .string("street", { length: 25, trim: true })
                                                .string("city", { length: 20, trim: true })
                                                .string("state", { length: 2, trim: true })
                                                .uint32("zip")
                                         });


var file = new FixedRecordFile(PersonRecord);

// Open the file...
file.open("data-fixed-example.dat");

let rec = {  id: x, 
                firstName: "John",
                lastName: `Doe${x}`, 
                address:  {
                    number: x*10000 + 321,
                    street: "Main St.",
                    city: "Everytown",
                    state: "DC",
                    zip: 20010
                }
            };

console.log(`Adding record ${x} as ${JSON.stringify(rec)}`);
file.appendRecord(rec);


// Retrieve and modify the above record...
rec = file.readRecord(0);
rec.firstName = "Jane";
rec.address.street = "Elm St.";
file.writeRecord(0, rec);


// Dump the contents of the file
console.log("\n\nFile contents:");
file.forEach(rec => { console.log(`    ${JSON.stringify(rec)}`) } );

```
