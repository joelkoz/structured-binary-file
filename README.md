structured-binary-file
======================
FixedRecordFile is a class that reads and writes binary data to fixed width record files. It provides an effecient storage mechanism similar to C's struct, yet keeps the convenience of working with Javascript objects.

CircularFile builds on FixedRecordFile but limits storage to a maximum number of records. Once that record limit 
has been reached, new appends drop the oldest record to make room for the newer record.  This makes implementing 
things like rolling logs very simple.

Files composed of fixed width binary records have several advantages over text based storage. Records can be quickly retrieved based on a simple calculation. They are generally smaller than text based storage in that numbers are stored in their binary representation vs character sequences. Finally, field values are based on column position vs. some other type of data value delimeter being stored in the file.


Records in FixedRecordFile and its derivitives are defined using the binary encoder/decoder found in the
project [binary-parser-encoder](https://www.npmjs.com/package/binary-parser-encoder).

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

let rec = {  id: 1, 
                firstName: "John",
                lastName: "Doe", 
                address:  {
                    number: 10321,
                    street: "Main St.",
                    city: "Everytown",
                    state: "DC",
                    zip: 20010
                }
            };

console.log(`Adding record as ${JSON.stringify(rec)}`);
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
