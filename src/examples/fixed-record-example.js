const FixedRecordFile = require("../FixedRecordFile.js");
const Parser = require("binary-parser-encoder").Parser;

(function () {

// Define the record structure of our test file...
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



// Define a FixedRecordFile as a collection of
// the above PersonRecords                        
var file = new FixedRecordFile(PersonRecord);

// Open the file...
file.open("data-fixed-example.dat");



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
    console.log(`Adding record ${x} as ${JSON.stringify(rec)}`);
    file.appendRecord(rec);
} // for

// Dump the contents of the file
console.log("\n\nFile contents:");
file.forEach(rec => { console.log(`    ${JSON.stringify(rec)}`) } );

// Modify record #2...
var rec = file.readRecord(2);
console.log(`\n\nRetrieved record 2: ${JSON.stringify(rec)}`);
rec.firstName = "Fred";
rec.lastName = "Krueger"
rec.address.number = 666;
rec.address.street = "Elm St.";
console.log(`Save record 2 as ${JSON.stringify(rec)}`);
file.writeRecord(2, rec);


// Dump the contents of the file
console.log("\n\nNew file contents:\n");
file.forEach(rec => { console.log(`    ${JSON.stringify(rec)}`) } );


file.close();


// An alternative way to iterate over the file...
function outputContents() {
    console.log("\n\nFile contents:");
    var rec = file.getFirst();
    while (rec != null) {
        console.log(`    ${JSON.stringify(rec)}`);
        rec = file.getNext();
    } // while
}


console.log('\n\nDone.');

})();