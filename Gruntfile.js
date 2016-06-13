module.exports = function(grunt) {
  var fs = require('fs');

  grunt.initConfig({
    mochaTest: {
      test: {
        src: ["spec/*.spec.js"]
      }
    },
    http: {
      scalers: {
        options: {
          url: "https://api.clever-cloud.com/v2/products/instances",
          gzip: true,
          agent: new (require("https").Agent)({ keepAlive: true }),
          callback: function(error, response, body){
            if(error){
              grunt.log.error(error);
            } else{
              var content = "module.exports=" + JSON.stringify(JSON.parse(body));
              fs.writeFileSync("./spec/application.instance-types.js", content);
            }
          }
        }
      }
    }
  });

  grunt.loadNpmTasks('grunt-http');
  grunt.loadNpmTasks('grunt-mocha-test');

  grunt.registerTask('test', ['http', 'mochaTest']);
};
