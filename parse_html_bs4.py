import re
from html.parser import HTMLParser

class DetailedParser(HTMLParser):
    def __init__(self):
        super().__init__()
        self.output_lines = []
        self.current_tag = None
        self.in_body = False
        self.nav_links = []
        self.images = []
        self.headings = []
        self.text_runs = []
        
    def handle_starttag(self, tag, attrs):
        self.current_tag = tag
        attrs_dict = dict(attrs)
        
        if tag == 'body':
            self.in_body = True
            
        if self.in_body:
            if tag == 'a' and 'href' in attrs_dict:
                self.nav_links.append((attrs_dict['href'], ''))
            elif tag == 'img':
                src = attrs_dict.get('src') or attrs_dict.get('data-src') or attrs_dict.get('srcset')
                alt = attrs_dict.get('alt', '')
                if src:
                    self.images.append((src, alt))
            elif tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6']:
                self.headings.append((tag, attrs_dict.get('class', ''), ''))
                
    def handle_endtag(self, tag):
        if tag == 'body':
            self.in_body = False
        self.current_tag = None
        
    def handle_data(self, data):
        if self.in_body and data.strip():
            text = data.strip()
            if len(text) > 1 and self.current_tag not in ['script', 'style']:
                self.text_runs.append((self.current_tag, text))
                # Add text to the last nav link if we are in an <a> tag
                if self.current_tag == 'a' and self.nav_links:
                    href, old_text = self.nav_links[-1]
                    self.nav_links[-1] = (href, (old_text + " " + text).strip())
                # Add text to the last heading if we are in h tag
                if self.current_tag in ['h1', 'h2', 'h3', 'h4', 'h5', 'h6'] and self.headings:
                    tag, cls, old_text = self.headings[-1]
                    self.headings[-1] = (tag, cls, (old_text + " " + text).strip())

def main():
    with open('C:/Users/HP/.gemini/antigravity/brain/0fbf699a-f094-483f-9a7e-57aa88ba1d89/scratch/fratelli_page.html', 'r', encoding='utf-8') as f:
        html = f.read()
        
    parser = DetailedParser()
    parser.feed(html)
    
    with open('C:/Users/HP/.gemini/antigravity/brain/0fbf699a-f094-483f-9a7e-57aa88ba1d89/scratch/homepage_elements.txt', 'w', encoding='utf-8') as out:
        out.write("=== HEADINGS ===\n")
        for tag, cls, text in parser.headings:
            if text:
                out.write(f"{tag} [{cls}]: {text}\n")
                
        out.write("\n=== NAVIGATION & LINKS ===\n")
        seen_links = set()
        for href, text in parser.nav_links:
            if text and href:
                pair = (href, text)
                if pair not in seen_links:
                    out.write(f"- {text} ({href})\n")
                    seen_links.add(pair)
                    
        out.write("\n=== IMAGES ===\n")
        seen_images = set()
        for src, alt in parser.images:
            if src not in seen_images:
                out.write(f"- {alt} : {src}\n")
                seen_images.add(src)
                
        out.write("\n=== TEXT RUNS ===\n")
        for tag, text in parser.text_runs:
            out.write(f"[{tag}] {text}\n")

    print("Parsed successfully!")

if __name__ == '__main__':
    main()
