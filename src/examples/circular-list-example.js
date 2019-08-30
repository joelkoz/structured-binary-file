const CircularFile = require("../CircularFile.js");
const Parser = require("binary-parser-encoder").Parser;

(function () {

// Define the record structure of our test file...
let TestRecord = Parser.start()
                        .uint16("id")
                        .string("name", { length: 25, trim: true })
                        .double("insertNumber");


// Define a CircularFile as a collection of at most five of
// the above TestRecords                        
var cfile = new CircularFile(TestRecord, 5);

// Open the file...
cfile.open("data-circular-example.dat");



// Now, add 9 records to the file, dumping the entire contents 
// of the file after each record. This will demonstrate how
// the file grows then stops at the five record limit...
for (var x = 0; x <= 9; x++) {
    let rec = { id: x, name: `Record num ${x}`, insertNumber: x };
    console.log(`\nAdding record ${x}`);
    cfile.appendRecord(rec);
    cfile.forEach(rec => { console.log(`    ${JSON.stringify(rec)}`) } );
} // for

cfile.close();


// An alternative way to iterate over the circular file...
function outputContents() {
    var rec = cfile.getFirst();
    while (rec != null) {
        console.log(`    ${JSON.stringify(rec)}`);
        rec = cfile.getNext();
    } // while
}


console.log('\n\nDone.');

})();