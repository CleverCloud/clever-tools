module.exports = function(grunt) {
  grunt.initConfig({
    jasmine_node: {
      all: ['spec/']
    }
  });

  grunt.loadNpmTasks('grunt-jasmine-node');

  grunt.registerTask('test', ['jasmine_node']);
};
