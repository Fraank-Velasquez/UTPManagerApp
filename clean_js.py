import os
import re

def remove_comments_js(content):
    def replacer(match):
        s = match.group(0)
        if s.startswith('/'):
            return '' # It's a comment
        else:
            return s # It's a string
    regex = r'(?P<string>"(?:\\.|[^"\\])*"|\'(?:\\.|[^\'\\])*\'|`(?:\\.|[^`\\])*`)|(?P<comment>//.*|/\*[\s\S]*?\*/)'
    return re.sub(regex, replacer, content)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = remove_comments_js(content)
    new_content = re.sub(r'\n\s*\n\s*\n', '\n\n', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Cleaned: {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith('.js'):
            process_file(os.path.join(root, file))
