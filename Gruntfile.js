/*global module:false*/

module.exports = function(grunt) {
    // Load plugin
    grunt.loadNpmTasks('grunt-contrib-jshint');
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Project configuration.
    grunt.initConfig({
        jshint: {
            all: ['*.js', 'stalwart/*.js', 'test/*.js']
        },
        qunit: {
            all: ['test/test-stalwart.html']
        }
    });

    // Task to run tests
    grunt.registerTask('test', ['jshint', 'qunit']);
    grunt.registerTask('default', ['test']);
};