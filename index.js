var optimist = require('optimist'),
    argv = optimist.argv,
    crop = require('./lib/crop'),
    consoler = require('consoler');

// CLI
exports.cli = function() {
    var params = argv._;
    var dest = '';
    
    if (params.length >= 1) {
        dest = process.cwd() + '\\' + params.slice(0) + '\\';
    }
    else{
        dest = process.cwd() + '\\todo_img\\';
    }
    var cropObj = new crop(dest);
    cropObj.run();

    
}