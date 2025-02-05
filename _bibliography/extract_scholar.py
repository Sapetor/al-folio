import re
import bibtexparser
from bibtexparser.bwriter import BibTexWriter

def parse_scholar_data(file_path):
    with open(file_path, 'r', encoding='utf-8') as f:
        content = f.read()
    
    papers = {}
    paper_sections = re.split(r'Paper \d+/\d+\n', content)
    
    for section in paper_sections:
        if not section.strip():
            continue
            
        title_match = re.search(r'Title: (.*?)\n', section)
        scholar_id_match = re.search(r"'author_pub_id': '([^']*)'", section)
        
        if title_match and scholar_id_match:
            title = title_match.group(1).strip()
            scholar_id = scholar_id_match.group(1).split(':')[-1]
            papers[title] = scholar_id
    
    return papers

def update_bib_with_scholar_ids(bib_file, papers_data_file, output_file):
    scholar_data = parse_scholar_data(papers_data_file)
    
    with open(bib_file, 'r', encoding='utf-8') as bibtex_file:
        bib_database = bibtexparser.load(bibtex_file)
    
    for entry in bib_database.entries:
        title = entry.get('title', '').strip()
        title = re.sub(r'\{|\}|\$|\\[a-zA-Z]+', '', title)
        title = ' '.join(title.split())
        
        if title in scholar_data:
            entry['google_scholar_id'] = scholar_data[title]
    
    writer = BibTexWriter()
    writer.indent = '  '
    
    with open(output_file, 'w', encoding='utf-8') as bibtex_file:
        bibtex_file.write(writer.write(bib_database))

if __name__ == "__main__":
    update_bib_with_scholar_ids(
        'papers.bib',
        'papers_data.csv', 
        'papers_updated_final.bib'
    )