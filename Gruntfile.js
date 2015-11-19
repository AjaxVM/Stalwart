/*global module:false*/

module.exports = function(grunt) {
    // Project configuration.
    grunt.initConfig({
        qunit: {
            'stalwart': ['test/test-stalwart.html']
        }
    });

    // Load plugin
    grunt.loadNpmTasks('grunt-contrib-qunit');

    // Task to run tests
    grunt.registerTask('travis', 'qunit:stalwart');
};