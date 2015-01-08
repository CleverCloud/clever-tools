module.exports = function(grunt) {
  grunt.initConfig({
    jasmine_node: {
      all: ['spec/']
    }
  });

  grunt.loadNpmTasks('grunt-jasmine-node');

  grunt.registerTask('default', ['jasmine_node']);
};
