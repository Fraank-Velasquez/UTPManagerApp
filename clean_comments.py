import os
import re

def remove_comments_java(content):
    # Regex for Java comments (single-line and multi-line)
    # Ignores // inside strings
    pattern = r'//.*|/\*[\s\S]*?\*/'
    # We must be careful not to match URLs like http://
    # A better approach:
    # First, match strings "..." so we can preserve them
    # This is tricky with regex. Let's use a robust approach for Java:
    def replacer(match):
        s = match.group(0)
        if s.startswith('/'):
            return '' # It's a comment
        else:
            return s # It's a string
    # Regex matches string literal OR comment
    regex = r'(?P<string>"(?:\\.|[^"\\])*")|(?P<comment>//.*|/\*[\s\S]*?\*/)'
    return re.sub(regex, replacer, content)

def remove_comments_css(content):
    # CSS only has /* */
    return re.sub(r'/\*[\s\S]*?\*/', '', content)

def remove_comments_html(content):
    # HTML comments <!-- -->
    return re.sub(r'<!--[\s\S]*?-->', '', content)

def process_file(filepath):
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    new_content = content
    if filepath.endswith('.java'):
        new_content = remove_comments_java(content)
    elif filepath.endswith('.css'):
        new_content = remove_comments_css(content)
    elif filepath.endswith('.html'):
        new_content = remove_comments_html(content)
    
    # Remove excessive blank lines left by comment removal
    new_content = re.sub(r'\n\s*\n\s*\n', '\n\n', new_content)

    if new_content != content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"Cleaned: {filepath}")

for root, dirs, files in os.walk('src'):
    for file in files:
        if file.endswith(('.java', '.css', '.html')):
            process_file(os.path.join(root, file))
