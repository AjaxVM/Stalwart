/*global module:false*/

module.exports = function(grunt) {
    // Load plugin
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Project configuration.
    // grunt.initConfig({
    //     qunit: {
    //         all: ['test/test-stalwart.html']
    //     }
    // });
    grunt.initConfig({
        qunit: {
            src: ['tests/test-stalwart.html']
        }
    });

    // Task to run tests
    grunt.registerTask('test', ['qunit:src']);
    grunt.registerTask('travis', ['test']);
};