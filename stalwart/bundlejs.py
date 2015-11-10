import os, sys

cur_path = os.path.dirname(os.path.realpath(sys.argv[0]))

new = open(os.path.join(cur_path, 'stalwart-combined.js'), 'wb');
ordered_files = [
    'stalwart.js',
    'defaults.js',
    'utils.js',
    'class.js',
]

for fname in ordered_files:
    #just load from list
    new.write('\n/*BEGIN MODULE: %s*/\n\n'%fname)
    new.write(open(os.path.join(cur_path, fname), 'rb').read())
    new.write('\n/*END MODULE: %s*/\n'%fname)

new.close()