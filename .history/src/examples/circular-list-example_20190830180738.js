const CircularFile = require("../circularFile.js");
const Parser = require("binary-parser-encoder").Parser;

(function () {

// Define the record structure of our test file...
let TestRecord = new Parser()
                        .uint16("id")
                        .string("name", { length: 25, trim: true })
                        .double("insertNumber");


// Define a CircularFile as a collection of at most five of
// the above TestRecords                        
var cfile = new CircularFile(TestRecord, 5);

// Open the file...
cfile.open("circular-example.dat");


// A function that outputs the entire contents of the circular file,
// one record after anouther...
function outputContents() {
    var rec = cfile.getFirst();
    while (rec != null) {
        console.log(`    ${JSON.stringify(rec)}`);
        rec = cfile.getNext();
    } // while
}


// Now, add 9 records to the file, dumping the entire contents 
// of the file after each record. This will demonstrate how
// the file grows then stops at the five record limit...
for (var x = 0; x <= 9; x++) {
    let rec = { id: x, name: `Record num ${x}`, insertNumber: x };
    console.log(`\nAdding record ${x}`);
    cfile.appendRecord(rec);
//    outputContents();
    cfile.forEach(rec => { console.log(`    ${JSON.stringify(rec)}`) } );
} // for

cfile.close();

console.log('\n\nDone.');

})();