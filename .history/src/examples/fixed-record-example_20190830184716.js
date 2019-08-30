const FixedRecordFile = require("../circularFile.js");
const Parser = require("binary-parser-encoder").Parser;

(function () {

// Define the record structure of our test file...
let PersonRecord = new Parser()
                        .uint16("id")
                        .string("firstName", { length: 15, trim: true })
                        .string("lastName", { length: 25, trim: true })
                        .next("address", Parser.start()
                                                .uint32("number")
                                                .string("street", { length: 25, trim: true })
                                                .string("city", { length: 20, trim: true })
                                                .string("state", { length: 2, trim: true })
                                                .uint32("zip"));



// Define a FixedRecordFile as a collection of
// the above TestRecords                        
var file = new FixedRecordFile(PersonRecord);

// Open the file...
file.open("example-circular.dat");



// Now, add 5 records to the file...
for (var x = 0; x <= 5; x++) {
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
    console.log(`\nAdding record ${x}`);
    file.appendRecord(rec);
} // for

// Dump the contents of the file
console.log("File contents:\n");
file.forEach(rec => { console.log(`    ${JSON.stringify(rec)}`) } );

// Modify record #2...
var rec = file.readRecord(2);
console.log(`\nRetrieved record 2: ${JSON.stringify(rec)}`);
rec.firstName = "Jane";
rec.address.street = "Elm St.";
console.log(`Save record 2 as ${JSON.stringify(rec)}`);
file.writeRecord(2, rec);


// Dump the contents of the file
console.log("\n\n New file contents:\n");
file.forEach(rec => { console.log(`    ${JSON.stringify(rec)}`) } );


file.close();


// An alternative way to iterate over the file...
function outputContents() {
    var rec = file.getFirst();
    while (rec != null) {
        console.log(`    ${JSON.stringify(rec)}`);
        rec = file.getNext();
    } // while
}


console.log('\n\nDone.');

})();